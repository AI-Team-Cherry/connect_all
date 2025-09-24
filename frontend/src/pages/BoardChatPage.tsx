import React, { useState, useRef, useEffect } from "react";
import {
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
  Grow,
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
} from "@mui/icons-material";
import { sendBoardChat } from "../services/boardChat";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface Message {
  sender: "user" | "bot";
  text: string;
  postLink?: string;
  timestamp?: Date;
  isTyping?: boolean;
  colabConnection?: boolean;
}

const departments = [
  { code: "", name: "전체", icon: <AIIcon />, color: "#9E9E9E" },
  { code: "MD", name: "마케팅", icon: <CampaignIcon />, color: "#2196F3" },
  { code: "CS", name: "고객서비스", icon: <SupportIcon />, color: "#4CAF50" },
  { code: "SW", name: "소프트웨어", icon: <CodeIcon />, color: "#FF9800" },
];

const BoardChatPage: React.FC = () => {
  const [department, setDepartment] = useState(""); // 기본값 전체
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "안녕하세요! 🤖 AI 상담 챗봇입니다. 질문을 자유롭게 해주세요.",
      timestamp: new Date(),
      colabConnection: true,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isConnectedToColab, setIsConnectedToColab] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentDept =
    departments.find((d) => d.code === department) || departments[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const welcomeMessage: Message = {
      sender: "bot",
      text: `안녕하세요! 🤖 ${currentDept.name} AI 상담 챗봇입니다. ${currentDept.name} 관련 질문을 자유롭게 해주세요.`,
      timestamp: new Date(),
      colabConnection: true,
    };
    setMessages([welcomeMessage]);
  }, [department]);

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
    } catch (err) {
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

  const CustomMessage = ({
    message,
    index,
  }: {
    message: Message;
    index: number;
  }) => {
    const isUser = message.sender === "user";
    const isTyping = message.isTyping;

    return (
      <Grow in={true} timeout={300 + index * 100}>
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
                animation: isTyping ? "pulse 1.5s infinite" : "none",
              }}
            >
              {isTyping ? <CircularProgress size={20} /> : <BotIcon />}
            </Avatar>
          )}

          <Paper
            elevation={0}
            sx={{
              maxWidth: "70%",
              p: 1.5,
              bgcolor: isUser ? currentDept.color : "rgba(255, 255, 255, 0.05)",
              color: isUser ? "white" : "#ffffff",
              borderRadius: isUser
                ? "18px 18px 4px 18px"
                : "18px 18px 18px 4px",
            }}
          >
            {isTyping ? (
              <Typography
                variant="body2"
                sx={{ color: "rgba(255, 255, 255, 0.6)" }}
              >
                AI가 답변을 생성중입니다...
              </Typography>
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {message.text}
              </Typography>
            )}
          </Paper>

          {isUser && (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                ml: 1,
              }}
            >
              <PersonIcon />
            </Avatar>
          )}
        </Box>
      </Grow>
    );
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 헤더 */}
      <Paper sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: currentDept.color }}>
            {currentDept.icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ color: "white" }}>
              {currentDept.name} AI 상담 챗봇
            </Typography>
          </Box>

          <Select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
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
        </Stack>
      </Paper>

      {/* 채팅 영역 */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {messages.map((message, index) => (
          <CustomMessage key={index} message={message} index={index} />
        ))}
        <div ref={chatEndRef} />
      </Box>

      {/* 입력창 */}
      <Box sx={{ p: 2 }}>
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
    </Box>
  );
};

export default BoardChatPage;
