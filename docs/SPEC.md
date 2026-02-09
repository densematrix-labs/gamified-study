# Gamified AI Study Platform — Mini Spec

## 目标
AI 驱动的游戏化学习平台，通过智能出题、即时反馈和成就系统让学习变得有趣高效。

## 核心功能

### 1. AI 智能出题
- 用户输入学习主题（如"JavaScript 闭包"、"法语动词变位"）
- AI 生成多样化题目：选择题、填空题、判断题
- 根据用户表现动态调整难度

### 2. 游戏化元素
- **XP 系统**：答对得经验值，连续答对有 combo 加成
- **等级系统**：累积 XP 升级，解锁新头衔
- **成就徽章**：完成特定目标获得徽章（首次全对、连续 7 天学习等）
- **每日挑战**：每天一组限时题目，完成获得额外奖励

### 3. 学习追踪
- 答题正确率统计
- 学习时长记录
- 薄弱领域识别

## 技术方案
- 前端：React + Vite (TypeScript) + Tailwind CSS
- 后端：Python FastAPI
- AI 调用：通过 llm-proxy.densematrix.ai
- 数据库：SQLite（简单持久化）
- 部署：Docker → langsheng

## 端口分配
- Frontend: 30055
- Backend: 30056

## 美学方向
**Retro Arcade / Pixel Art Inspired**
- 怀旧游戏机风格，像素化装饰元素
- 霓虹色调（青色、品红、金色）在深色背景上
- Press Start 2P / VT323 等像素字体
- 8-bit 风格的进度条和成就图标
- 屏幕扫描线效果和 CRT 光晕

## 完成标准
- [x] 核心功能可用（输入主题 → 生成题目 → 答题 → 获得 XP）
- [x] 部署到 gamified-study.demo.densematrix.ai
- [x] Health check 通过
- [x] 7 种语言支持
- [x] 支付集成
- [x] SEO 优化 + 5000+ programmatic 页面
