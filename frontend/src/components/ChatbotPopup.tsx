import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  Stack,
  Avatar,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Campaign as CampaignIcon,
  SupportAgent as SupportIcon,
  Code as CodeIcon,
  AutoAwesome as AIIcon,
  Science as ColabIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { sendBoardChat } from "../services/boardChat";
import { useAuth } from "../contexts/AuthContext";

interface Message {
  sender: "user" | "bot";
  text: string;
  postLink?: string;
  timestamp?: Date;
  isTyping?: boolean;
  colabConnection?: boolean;
}

interface ChatbotPopupProps {
  open: boolean;
  onClose: () => void;
}

const departments = [
  { code: "", name: "전체", icon: <AIIcon />, color: "#9E9E9E" },
  { code: "MD", name: "마케팅", icon: <CampaignIcon />, color: "#2196F3" },
  { code: "CS", name: "고객서비스", icon: <SupportIcon />, color: "#4CAF50" },
  { code: "SW", name: "소프트웨어", icon: <CodeIcon />, color: "#FF9800" },
];

const ChatbotPopup: React.FC<ChatbotPopupProps> = ({ open, onClose }) => {
  const [department, setDepartment] = useState(""); // ✅ 기본값 전체
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnectedToColab, setIsConnectedToColab] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const currentDept =
    departments.find((d) => d.code === department) || departments[0];

  // ✅ mount 시 1번만 welcome 메시지 추가
  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text: "안녕하세요! 🤖 AI 상담 챗봇입니다. 질문을 자유롭게 해주세요.",
        timestamp: new Date(),
        colabConnection: true,
      },
    ]);
  }, []);

  // 스크롤 자동 내려가기
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const question = input.trim();

    const userMessage: Message = {
      sender: "user",
      text: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const typingMessage: Message = {
      sender: "bot",
      text: "typing...",
      isTyping: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      // ✅ department 없으면 undefined 로 보냄
      const res = await sendBoardChat(question, department || undefined);
      console.log("📌 BoardChat API 응답:", res);

      setMessages((prev) => prev.filter((msg) => !msg.isTyping));

      const answer =
        res.answer && res.answer.length > 0
          ? res.answer
          : "관련 답변을 찾지 못했습니다. 새로운 질문을 게시판에 올려보시겠어요?";

      const botMessage: Message = {
        sender: "bot",
        text: answer,
        postLink: res.postLink,
        timestamp: new Date(),
        colabConnection: isConnectedToColab,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("❌ BoardChat API 에러:", err);
      setMessages((prev) => prev.filter((msg) => !msg.isTyping));

      const errorMessage: Message = {
        sender: "bot",
        text: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        timestamp: new Date(),
        colabConnection: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Grow 제거 → 입력 시 메시지 깜빡임 방지
  const CustomMessage = ({ message }: { message: Message }) => {
    const isUser = message.sender === "user";
    const isTyping = message.isTyping;

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: isUser ? "flex-end" : "flex-start",
          mb: 1,
          px: 1,
        }}
      >
        {!isUser && (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: isTyping ? "#f0f0f0" : currentDept.color,
              mr: 1,
            }}
          >
            {isTyping ? <CircularProgress size={16} /> : <BotIcon />}
          </Avatar>
        )}
        <Paper
          elevation={0}
          sx={{
            maxWidth: "75%",
            p: 1.5,
            bgcolor: isUser ? currentDept.color : "rgba(255, 255, 255, 0.05)",
            color: isUser ? "white" : "#ffffff",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          }}
        >
          {isTyping ? (
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
              AI가 답변을 생성중입니다...
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {message.text}
            </Typography>
          )}
        </Paper>
        {isUser && (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "rgba(255,255,255,0.1)",
              ml: 1,
            }}
          >
            <PersonIcon />
          </Avatar>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: "80vh",
          bgcolor: "rgba(18, 18, 18, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      }}
    >
      {/* 헤더 */}
      <DialogTitle
        sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: currentDept.color }}>
            {currentDept.icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: "white" }}>
              {currentDept.name} AI 상담 챗봇
            </Typography>
          </Box>

          {/* ✅ 부서 선택 */}
          <Select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            size="small"
            sx={{ minWidth: 120, color: "white" }}
          >
            {departments.map((dept) => (
              <MenuItem key={dept.code} value={dept.code}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {dept.icon}
                  <span>{dept.name}</span>
                </Stack>
              </MenuItem>
            ))}
          </Select>

          <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* 채팅 영역 */}
      <DialogContent
        sx={{ p: 1, display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Box sx={{ flex: 1, overflow: "auto", px: 1, py: 2 }}>
          {messages.map((message, index) => (
            <CustomMessage key={index} message={message} />
          ))}
          <div ref={chatEndRef} />
        </Box>

        {/* 입력창 */}
        <Box sx={{ pt: 1 }}>
          <Paper sx={{ p: 1, borderRadius: 3 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField
                fullWidth
                multiline
                maxRows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  department
                    ? `${currentDept.name} 관련 질문을 입력하세요...`
                    : "질문을 입력하세요..."
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={loading}
              />
              <IconButton
                onClick={handleSend}
                disabled={loading || !input.trim()}
                sx={{ bgcolor: currentDept.color, color: "white" }}
              >
                {loading ? <CircularProgress size={16} /> : <SendIcon />}
              </IconButton>
            </Stack>
          </Paper>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ChatbotPopup;
