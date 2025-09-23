import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Divider,
  Button,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  Palette,
  Notifications,
  Security,
  Storage,
  Brightness4,
  Brightness7,
  BrightnessAuto,
  DarkMode,
  AccountCircle,
  Email,
  Phone,
  Work,
  Edit,
  Save,
  Restore,
} from "@mui/icons-material";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile } from "../services/auth";

const SettingsPage: React.FC = () => {
  const { colorMode, setColorMode } = useTheme();
  const { user, refreshUser, loading } = useAuth();

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    analysis: true,
    sharing: true,
  });

  const [autoSave, setAutoSave] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("설정이 저장되었습니다!");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  // 프로필 수정 상태
  const [editProfile, setEditProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    department: user?.department || "",
    jobTitle: user?.jobTitle || "",
    company: user?.company || "",
    workLocation: user?.workLocation || "",
    bio: user?.bio || "",
  });

  // 사용자 정보가 변경될 때마다 editProfile 업데이트
  useEffect(() => {
    if (user) {
      setEditProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department || "",
        jobTitle: user.jobTitle || "",
        company: user.company || "",
        workLocation: user.workLocation || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const handleSaveSettings = () => {
    // 설정 저장 로직 (로컬 스토리지나 API 호출)
    localStorage.setItem("notifications", JSON.stringify(notifications));
    localStorage.setItem("autoSave", JSON.stringify(autoSave));

    setSnackbarOpen(true);
  };

  const handleResetSettings = () => {
    setColorMode("dark");
    setNotifications({
      email: true,
      push: false,
      analysis: true,
      sharing: true,
    });
    setAutoSave(true);
    setSnackbarOpen(true);
  };

  const themeOptions = [
    {
      value: "light",
      label: "라이트 모드",
      icon: <Brightness7 />,
      description: "밝고 깔끔한",
    },
    {
      value: "dark",
      label: "다크 모드",
      icon: <DarkMode />,
      description: "어둡고 집중도 높은",
    },
    {
      value: "system",
      label: "시스템 설정",
      icon: <BrightnessAuto />,
      description: "시스템 설정에 따라 자동 변경",
    },
  ];


  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          설정
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          사용자 정보를 불러오는 중입니다...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        설정
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        애플리케이션 설정을 관리하고 개인화하세요
      </Typography>

      {/* 사용자 프로필 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <AccountCircle sx={{ fontSize: 40 }} />
            <Typography variant="h6">프로필 설정</Typography>
          </Box>

          <List>
            <ListItem>
              <ListItemIcon>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText 
                primary="사원번호" 
                secondary={user?.employeeId || "사원번호 정보 없음"} 
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => setProfileDialogOpen(true)}>
                  <Edit />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Email />
              </ListItemIcon>
              <ListItemText
                primary="이메일"
                secondary={user?.email || "이메일 정보 없음"}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Work />
              </ListItemIcon>
              <ListItemText
                primary="부서"
                secondary={user?.department || "부서 정보 없음"}
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* 테마 설정 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Palette />
            <Typography variant="h6">테마 설정</Typography>
          </Box>

          <FormControl component="fieldset">
            <FormLabel component="legend">화면 모드 선택</FormLabel>
            <RadioGroup
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as any)}
              sx={{ mt: 1 }}
            >
              {themeOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {option.icon}
                        <Typography variant="body1">{option.label}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Notifications />
            <Typography variant="h6">알림 설정</Typography>
          </Box>

          <List>
            <ListItem>
              <ListItemText
                primary="이메일 알림"
                secondary="분석 완료 및 중요 공지사항을 이메일로 받습니다"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.email}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      email: e.target.checked,
                    })
                  }
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText
                primary="푸시 알림"
                secondary="브라우저 푸시 알림을 받습니다"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.push}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      push: e.target.checked,
                    })
                  }
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText
                primary="분석 완료 알림"
                secondary="데이터 분석이 완료되면 알림을 받습니다"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.analysis}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      analysis: e.target.checked,
                    })
                  }
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText
                primary="공유 분석 알림"
                secondary="새로운 공유 분석이 있을 때 알림을 받습니다"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={notifications.sharing}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      sharing: e.target.checked,
                    })
                  }
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>


      {/* 데이터 및 저장소 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Storage />
            <Typography variant="h6">데이터 및 저장소</Typography>
          </Box>

          <List>
            <ListItem>
              <ListItemText
                primary="자동 저장"
                secondary="분석 결과를 자동으로 저장합니다"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* 설정 저장/초기화 버튼 */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          startIcon={<Restore />}
          onClick={handleResetSettings}
        >
          기본값으로 초기화
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSaveSettings}
        >
          설정 저장
        </Button>
      </Box>

      {/* 프로필 수정 다이얼로그 */}
      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>프로필 수정</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="이름"
            value={editProfile.name}
            onChange={(e) =>
              setEditProfile({ ...editProfile, name: e.target.value })
            }
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="이메일"
            type="email"
            value={editProfile.email}
            onChange={(e) =>
              setEditProfile({ ...editProfile, email: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="전화번호"
            value={editProfile.phone}
            onChange={(e) =>
              setEditProfile({ ...editProfile, phone: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="부서"
            value={editProfile.department}
            onChange={(e) =>
              setEditProfile({ ...editProfile, department: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="직책"
            value={editProfile.jobTitle}
            onChange={(e) =>
              setEditProfile({ ...editProfile, jobTitle: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="회사"
            value={editProfile.company}
            onChange={(e) =>
              setEditProfile({ ...editProfile, company: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="근무지"
            value={editProfile.workLocation}
            onChange={(e) =>
              setEditProfile({ ...editProfile, workLocation: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="자기소개"
            multiline
            rows={3}
            value={editProfile.bio}
            onChange={(e) =>
              setEditProfile({ ...editProfile, bio: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>취소</Button>
          <Button
            onClick={async () => {
              setProfileSaving(true);
              try {
                // DB에 프로필 업데이트
                await updateProfile(editProfile);
                
                // AuthContext에서 사용자 정보 새로고침
                await refreshUser();
                
                setProfileDialogOpen(false);
                setSnackbarMessage("프로필이 성공적으로 업데이트되었습니다!");
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
              } catch (error) {
                console.error("프로필 업데이트 실패:", error);
                setSnackbarMessage("프로필 업데이트에 실패했습니다.");
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
              } finally {
                setProfileSaving(false);
              }
            }}
            variant="contained"
            disabled={profileSaving}
          >
            {profileSaving ? "저장 중..." : "저장"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 저장 완료 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
