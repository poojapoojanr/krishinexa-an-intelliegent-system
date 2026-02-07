# 🌾 KrishiNexa - Intelligent Agricultural System

**KrishiNexa** is a comprehensive AI-powered agricultural platform designed to revolutionize farming through intelligent tools and data-driven insights. Built with cutting-edge technology, it empowers farmers with disease detection, crop recommendations, weather monitoring, and smart agricultural decision-making capabilities.

## ✨ Key Features

### 🤖 AI-Powered Tools

- **Disease Detection**: Advanced computer vision models for crop disease identification
- **Crop Recommendation**: ML-based suggestions for optimal crop selection
- **Voice Assistant**: Multilingual AI assistant for farming queries
- **Smart Analytics**: Real-time agricultural data analysis

### 🌡️ Environmental Monitoring

- **Weather Forecasting**: Real-time weather updates and alerts
- **Soil Health Analysis**: Smart sensor integration and soil monitoring
- **Satellite Imagery**: Remote sensing for crop monitoring

### 📊 Management Features

- **Seasonal Planner**: Intelligent crop planning and scheduling
- **Market Prices**: Live commodity price tracking
- **Dashboard**: Comprehensive farming activity overview
- **Community Platform**: Farmer networking and knowledge sharing

## 🚀 Technology Stack

### Frontend

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern styling framework
- **Firebase**: Authentication and real-time database

### Backend

- **Python + FastAPI**: High-performance API development
- **TensorFlow/Keras**: Machine learning models
- **Redis**: Caching and session management
- **MongoDB**: Database for agricultural data

### AI/ML Models

- **MobileNetV2**: Lightweight image classification
- **Random Forest**: Crop recommendation algorithms
- **Custom CNN**: Disease detection models
- **NLP Models**: Voice assistant capabilities

## 📦 Installation

### Prerequisites

```bash
Node.js >= 18.0.0
Python >= 3.9.0
Redis Server
MongoDB (optional)
```

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/poojapoojanr/krishinexa-an--intelliegent-system.git
   cd KrishiNexa
   ```

2. **Install dependencies**

   ```bash
   # Frontend dependencies
   npm install

   # Backend dependencies
   cd ml-backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Environment Setup**

   ```bash
   # Copy environment template
   cp .env.example .env.local

   # Configure your API keys and database connections
   ```

4. **Start Development Servers**

   ```bash
   # Terminal 1: Frontend
   npm run dev

   # Terminal 2: Backend
   cd ml-backend
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file with the following configuration:

```env
# Weather API
OPENWEATHER_API_KEY=your_api_key

# Location Services
LOCATIONIQ_API_KEY=your_locationiq_key

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef

# AI Services (Optional)
GROQ_API_KEY=your_groq_key
OLLAMA_BASE_URL=http://localhost:11434
```

## 📁 Project Structure

```
KrishiNexa/
├── 📂 src/                    # Next.js Frontend
│   ├── 📂 app/               # App Router pages
│   ├── 📂 components/        # Reusable UI components
│   ├── 📂 ai/               # AI service integrations
│   ├── 📂 firebase/         # Firebase configuration
│   ├── 📂 lib/              # Utility functions
│   └── 📂 types/            # TypeScript definitions
├── 📂 ml-backend/            # Python Backend
│   ├── 📂 app/              # FastAPI application
│   ├── 📂 Data/             # Training datasets
│   └── main.py              # Backend entry point
├── 📂 public/               # Static assets
├── 📂 scripts/              # Automation scripts
├── 📄 package.json          # Node.js dependencies
├── 📄 requirements.txt      # Python dependencies
└── 📄 README.md            # This file
```

## 🔗 API Endpoints

### Disease Detection

```http
POST /api/disease-detection
Content-Type: multipart/form-data

# Upload crop image for disease analysis
```

### Crop Recommendation

```http
POST /api/crop-recommendation
Content-Type: application/json

{
  "soil_type": "loamy",
  "ph_level": 6.5,
  "rainfall": 200,
  "temperature": 25
}
```

### Weather Data

```http
GET /api/weather?lat=12.34&lon=56.78
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with descriptive messages**
   ```bash
   git commit -m "Add amazing feature for crop analysis"
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Ensure code passes linting

## 🔒 Security

- All sensitive data is properly encrypted
- API keys are never committed to version control
- Authentication is handled through Firebase
- Input validation on all endpoints



## 📞 Support

- **Email**: majorprojectsjce@gmail.com
- **Issues**: [GitHub Issues](https://github.com/poojapoojanr/krishinexa-an--intelliegent-system/issues)
- **Documentation**: Coming Soon

## 🙏 Acknowledgments

- OpenWeather API for weather data
- TensorFlow team for ML frameworks
- Firebase for backend services
- The open-source community

---

**Built with ❤️ for Indian Agriculture** 🇮🇳
