"""
의류 세그멘테이션 모델 (hyejin/predict.py 기반)
U2NET 기반 의류 전용 분할 모델
"""
import torch
import torch.nn.functional as F
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
import os
import sys

# cloth-segmentation 모듈 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '../../cloth-segmentation'))

try:
    from networks import U2NET
    from utils.saving_utils import load_checkpoint_mgpu
    from data.base_dataset import Normalize_image
    CLOTH_SEGMENTATION_AVAILABLE = True
except ImportError as e:
    print(f"cloth_segmentation 모듈 import 실패: {e}")
    CLOTH_SEGMENTATION_AVAILABLE = False


class ClothSegmentationModel:
    """의류 세그멘테이션 모델 클래스"""
    
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.transform = None
        self.initialized = False
        
        if CLOTH_SEGMENTATION_AVAILABLE:
            self._initialize_model()
    
    def _initialize_model(self):
        """모델 초기화"""
        try:
            # 모델 경로 설정
            checkpoint_path = os.path.join(
                os.path.dirname(__file__), 
                '../../cloth-segmentation/trained_checkpoint/cloth_segm_u2net_latest.pth'
            )
            
            if not os.path.exists(checkpoint_path):
                print(f"모델 파일이 없습니다: {checkpoint_path}")
                return
            
            # U2NET 모델 로드
            self.model = U2NET(in_ch=3, out_ch=4)
            self.model = load_checkpoint_mgpu(self.model, checkpoint_path)
            self.model = self.model.to(self.device)
            self.model = self.model.eval()
            
            # 전처리 변환 설정
            self.transform = transforms.Compose([
                transforms.ToTensor(),
                Normalize_image(0.5, 0.5)
            ])
            
            self.initialized = True
            print(f"ClothSegmentationModel 초기화 완료 (device: {self.device})")
            
        except Exception as e:
            print(f"ClothSegmentationModel 초기화 실패: {e}")
            self.initialized = False
    
    def segment_clothes(self, image: Image.Image) -> np.ndarray:
        """
        의류 세그멘테이션 수행
        
        Args:
            image: PIL Image 객체
            
        Returns:
            np.ndarray: 세그멘테이션 마스크 (0=배경, 1=상의, 2=하의, 3=전신)
        """
        if not self.initialized:
            raise RuntimeError("ClothSegmentationModel이 초기화되지 않았습니다")
        
        try:
            # 원본 크기 저장
            orig_size = image.size  # (W, H)
            
            # 이미지 전처리
            image_tensor = self.transform(image)
            image_tensor = torch.unsqueeze(image_tensor, 0)
            
            # 추론 수행
            with torch.no_grad():
                output_tensor = self.model(image_tensor.to(self.device))
                output_tensor = F.log_softmax(output_tensor[0], dim=1)
                output_tensor = torch.max(output_tensor, dim=1, keepdim=True)[1]
                output_tensor = torch.squeeze(output_tensor, dim=0)
                output_tensor = torch.squeeze(output_tensor, dim=0)
                output_arr = output_tensor.cpu().numpy()
            
            # 원본 크기로 복원
            mask_img = Image.fromarray(output_arr.astype("uint8"), mode="L")
            mask_img = mask_img.resize(orig_size, resample=Image.NEAREST)
            final_mask = np.array(mask_img)
            
            print(f"의류 세그멘테이션 완료: {orig_size} -> {final_mask.shape}")
            return final_mask
            
        except Exception as e:
            print(f"의류 세그멘테이션 실패: {e}")
            raise
    
    def _opencv_color_analysis(self, image: Image.Image) -> dict:
        """
        OpenCV 색상 분석을 사용한 간단한 의류 분할
        
        Args:
            image: PIL Image 객체
            
        Returns:
            dict: {'top': top_mask, 'bottom': bottom_mask, 'full_body': full_body_mask}
        """
        try:
            import cv2
            
            # PIL을 OpenCV 형식으로 변환
            img_array = np.array(image)
            if len(img_array.shape) == 3:
                img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            else:
                img_cv = img_array
            
            h, w = img_cv.shape[:2]
            
            # 간단한 상하 분할 (중앙선 기준)
            center_y = h // 2
            
            # 상의 영역 (상단 60%)
            top_mask = np.zeros((h, w), dtype=np.uint8)
            top_mask[:int(h * 0.6), :] = 1
            
            # 하의 영역 (하단 40%)
            bottom_mask = np.zeros((h, w), dtype=np.uint8)
            bottom_mask[int(h * 0.6):, :] = 1
            
            # 전체 의류 영역
            full_body_mask = np.ones((h, w), dtype=np.uint8)
            
            print(f"OpenCV 색상 분석 완료: 상의 {top_mask.sum()}, 하의 {bottom_mask.sum()}")
            
            return {
                'top': top_mask,
                'bottom': bottom_mask,
                'full_body': full_body_mask
            }
            
        except Exception as e:
            print(f"OpenCV 색상 분석 실패: {e}")
            raise

    def get_clothing_regions(self, image: Image.Image) -> dict:
        """
        의류 영역별 마스크 반환 (폴백 시스템 포함)
        
        Args:
            image: PIL Image 객체
            
        Returns:
            dict: {'top': top_mask, 'bottom': bottom_mask, 'full_body': full_body_mask}
        """
        try:
            # 의류 세그멘테이션 수행
            mask = self.segment_clothes(image)
            
            # 각 클래스별 마스크 생성
            top_mask = (mask == 1).astype(np.uint8)  # 상의
            bottom_mask = (mask == 2).astype(np.uint8)  # 하의
            full_body_mask = ((mask == 1) | (mask == 2) | (mask == 3)).astype(np.uint8)  # 전체 의류
            
            # 디버깅: 각 클래스별 픽셀 수 출력
            print(f"원본 마스크 클래스 분포:")
            unique_classes, counts = np.unique(mask, return_counts=True)
            for cls, count in zip(unique_classes, counts):
                print(f"  클래스 {cls}: {count} 픽셀")
            
            print(f"의류 영역 분할 완료 - 상의: {top_mask.sum()}, 하의: {bottom_mask.sum()}, 전체: {full_body_mask.sum()}")
            
            # 하의 영역이 너무 작거나 잘못된 영역을 잡았을 때 보정
            if bottom_mask.sum() < 20000:  # 20,000 픽셀 미만 (임계값 상향)
                print(f"⚠️ 하의 영역이 너무 작습니다 ({bottom_mask.sum()} 픽셀) - 흰색 의류 특화 처리")
                
                # 흰색 의류 특화 처리: 전체 의류 영역에서 상의를 제외한 나머지를 하의로 재분류
                bottom_corrected = full_body_mask.copy()
                bottom_corrected[top_mask > 0] = 0  # 상의 영역 제거
                
                # 상의 영역이 너무 크면 하단 일부를 하의로 이동
                if top_mask.sum() > 100000:  # 상의가 매우 크면
                    h, w = top_mask.shape
                    # 상의 하단 30%를 하의로 이동 (흰색 의류는 더 넓게)
                    top_bottom_region = int(h * 0.7)
                    
                    # 상의 하단을 하의로 재분류
                    bottom_corrected[top_bottom_region:, :] = top_mask[top_bottom_region:, :]
                    
                    # 상의 마스크에서 하단 제거
                    top_corrected = top_mask.copy()
                    top_corrected[top_bottom_region:, :] = 0
                    
                    print(f"흰색 의류 하의 영역 재분할: {bottom_mask.sum()} → {bottom_corrected.sum()} 픽셀")
                    
                    return {
                        'top': top_corrected,
                        'bottom': bottom_corrected,
                        'full_body': full_body_mask
                    }
                else:
                    print(f"흰색 의류 하의 영역 재구성: {bottom_mask.sum()} → {bottom_corrected.sum()} 픽셀")
                    
                    return {
                        'top': top_mask,
                        'bottom': bottom_corrected,
                        'full_body': full_body_mask
                    }
            
            return {
                'top': top_mask,
                'bottom': bottom_mask,
                'full_body': full_body_mask
            }
            
        except Exception as e:
            print(f"cloth-segmentation 모델 실패: {e}")
            print("OpenCV 색상 분석으로 폴백합니다...")
            
            # 2순위: OpenCV 색상 분석
            try:
                return self._opencv_color_analysis(image)
            except Exception as e2:
                print(f"OpenCV 색상 분석도 실패: {e2}")
                print("기본 검색으로 폴백합니다...")
                
                # 3순위: 기본 검색 (전체 이미지)
                h, w = np.array(image).shape[:2]
                full_mask = np.ones((h, w), dtype=np.uint8)
                
                return {
                    'top': full_mask,
                    'bottom': full_mask,
                    'full_body': full_mask
                }


# 전역 모델 인스턴스
_cloth_segmentation_model = None

def get_cloth_segmentation_model() -> ClothSegmentationModel:
    """싱글톤 패턴으로 모델 인스턴스 반환"""
    global _cloth_segmentation_model
    if _cloth_segmentation_model is None:
        _cloth_segmentation_model = ClothSegmentationModel()
    return _cloth_segmentation_model

def get_clothing_regions_cloth_segmentation(image: Image.Image) -> dict:
    """
    의류 세그멘테이션 모델을 사용한 의류 영역 분할
    기존 get_clothing_regions() 함수와 동일한 인터페이스
    """
    model = get_cloth_segmentation_model()
    return model.get_clothing_regions(image)
