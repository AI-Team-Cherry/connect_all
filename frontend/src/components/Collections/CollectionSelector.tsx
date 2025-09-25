import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import {
  Storage,
  Description,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import { getCollections, getCollectionInfo, CollectionInfo } from '../../services/collections';

interface CollectionSelectorProps {
  selectedCollections: string[];
  onCollectionSelect: (collections: string[]) => void;
}

const CollectionSelector: React.FC<CollectionSelectorProps> = ({
  selectedCollections,
  onCollectionSelect,
}) => {
  const [collections, setCollections] = useState<string[]>([]);
  const [collectionInfos, setCollectionInfos] = useState<Record<string, CollectionInfo>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);
/*
  const loadCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const collectionList = await getCollections();
      setCollections(collectionList);

      // 각 컬렉션의 정보도 미리 로드
      const infos: Record<string, CollectionInfo> = {};
      for (const collection of collectionList) {
        try {
          const info = await getCollectionInfo(collection);
          infos[collection] = info;
        } catch (error) {
          console.warn(`컬렉션 ${collection} 정보 로드 실패:`, error);
        }
      }
      setCollectionInfos(infos);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
*/
const loadCollections = async () => {
  setLoading(true);
  setError(null);
  try {
    const collectionList = await getCollections(); // ["orders", "users", ...]
    const infos: Record<string, CollectionInfo> = {};
    const validCollections: string[] = [];

    for (const collection of collectionList) {
      try {
        const info = await getCollectionInfo(collection);
        if (info.documentCount > 0) {
          validCollections.push(collection);
          infos[collection] = info;
        }
      } catch (error) {
        console.warn(`컬렉션 ${collection} 정보 로드 실패:`, error);
      }
    }

    // 🔹 product를 맨 앞으로
    const sorted = validCollections.sort((a, b) => {
      if (a === "product") return -1;
      if (b === "product") return 1;
      return a.localeCompare(b);
    });

    setCollections(sorted);
    setCollectionInfos(infos);
  } catch (error: any) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};



  const handleCollectionClick = (collection: string) => {
    if (selectedCollections.includes(collection)) {
      // 이미 선택된 컬렉션을 다시 클릭하면 선택 해제
      onCollectionSelect(selectedCollections.filter(c => c !== collection));
    } else {
      // 새로운 컬렉션 추가
      onCollectionSelect([...selectedCollections, collection]);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography>컬렉션 목록을 불러오는 중...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Storage sx={{ mr: 1 }} />
          데이터 컬렉션 선택
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          분석할 MongoDB 컬렉션을 선택하세요. 선택한 컬렉션의 데이터를 기반으로 AI가 분석합니다.
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {selectedCollections.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
              <Info sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ mr: 1 }}>선택된 컬렉션:</Typography>
              {selectedCollections.map((collection, index) => (
                <Chip
                  key={collection}
                  label={collection}
                  size="small"
                  color="primary"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>
          </Alert>
        )}

        {collections.length === 0 ? (
          <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ py: 2 }}>
            사용 가능한 컬렉션이 없습니다.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {collections.map((collection) => {
              const isSelected = selectedCollections.includes(collection);
              const info = collectionInfos[collection];

              return (
                <Box key={collection}>
                  <Tooltip
                    title={
                      info
                        ? `문서 수: ${info.documentCount.toLocaleString()}개 | 필드: ${info.sampleFields.join(', ')}`
                        : '컬렉션 정보 로딩 중...'
                    }
                    arrow
                  >
                    <Paper
                      elevation={isSelected ? 4 : 1}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: isSelected ? 2 : 1,
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        bgcolor: isSelected ? 'primary.light' : 'background.paper',
                        color: isSelected ? 'primary.contrastText' : 'text.primary',
                        transition: 'all 0.2s',
                        width: '100%',
                        '&:hover': {
                          elevation: 3,
                          bgcolor: isSelected ? 'primary.light' : 'action.hover',
                        },
                      }}
                      onClick={() => handleCollectionClick(collection)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Description sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {collection}
                        </Typography>
                        {isSelected && <CheckCircle sx={{ ml: 'auto', fontSize: 20 }} />}
                      </Box>

                      {info && (
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            {info.documentCount.toLocaleString()}개 문서
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {info.sampleFields.slice(0, 3).map((field) => (
                              <Chip
                                key={field}
                                label={field}
                                size="small"
                                sx={{
                                  mr: 0.5,
                                  mb: 0.5,
                                  bgcolor: isSelected ? 'rgba(255,255,255,0.2)' : 'action.selected',
                                  fontSize: '0.7rem'
                                }}
                              />
                            ))}
                            {info.sampleFields.length > 3 && (
                              <Chip
                                label={`+${info.sampleFields.length - 3}`}
                                size="small"
                                sx={{
                                  mr: 0.5,
                                  mb: 0.5,
                                  bgcolor: isSelected ? 'rgba(255,255,255,0.2)' : 'action.selected',
                                  fontSize: '0.7rem'
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CollectionSelector;