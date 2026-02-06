'use client'

import { useState, useEffect, useRef } from 'react'
import { callAIAgent, uploadFiles } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Camera, MessageSquare, ChevronDown, ChevronUp, Send, User, Globe, ArrowLeft, Upload, AlertTriangle } from 'lucide-react'

// Agent IDs
const MEDICINE_SCANNER_AGENT_ID = '6985a5fb5eb49186d63e5df4'
const HEALTH_ASSISTANT_AGENT_ID = '6985a61fe2c0086a4fc43bf1'

// TypeScript Interfaces from test_responses
interface MedicineScannerResponse {
  medicine_name: string
  generic_name: string
  category: string
  uses: string[]
  pregnancy_warning: string
  side_effects: string[]
  contraindications: string[]
  dosage_note: string
}

interface HealthAssistantResponse {
  message: string
  risk_level: 'LOW' | 'MODERATE' | 'HIGH'
  pregnancy_alert: boolean
  recommendation: string
  language_used: string
  safe_home_remedies: string[]
  warning_signs: string[]
}

interface UserProfile {
  name: string
  age: string
  isPregnant: 'yes' | 'no' | ''
  allergies: string
  conditions: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  data?: HealthAssistantResponse
  timestamp: Date
}

interface ActivityItem {
  id: string
  type: 'scan' | 'chat'
  title: string
  timestamp: Date
}

type Screen = 'login' | 'language' | 'dashboard' | 'chat' | 'scan'
type Language = 'hindi' | 'english' | ''

export default function Home() {
  // State Management
  const [currentScreen, setCurrentScreen] = useState<Screen>('login')
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    age: '',
    isPregnant: '',
    allergies: '',
    conditions: ''
  })
  const [language, setLanguage] = useState<Language>('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [scanResult, setScanResult] = useState<MedicineScannerResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load saved data from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('medimart_profile')
    const savedLanguage = localStorage.getItem('medimart_language')
    const savedMessages = localStorage.getItem('medimart_messages')
    const savedActivity = localStorage.getItem('medimart_activity')

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile))
    }
    if (savedLanguage) {
      setLanguage(JSON.parse(savedLanguage))
    }
    if (savedMessages) {
      const messages = JSON.parse(savedMessages)
      setChatMessages(messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })))
    }
    if (savedActivity) {
      const activity = JSON.parse(savedActivity)
      setRecentActivity(activity.map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) })))
    }

    // Auto-navigate based on saved data
    if (savedProfile && savedLanguage) {
      setCurrentScreen('dashboard')
    } else if (savedProfile) {
      setCurrentScreen('language')
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (userProfile.name) {
      localStorage.setItem('medimart_profile', JSON.stringify(userProfile))
    }
  }, [userProfile])

  useEffect(() => {
    if (language) {
      localStorage.setItem('medimart_language', JSON.stringify(language))
    }
  }, [language])

  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('medimart_messages', JSON.stringify(chatMessages))
    }
  }, [chatMessages])

  useEffect(() => {
    if (recentActivity.length > 0) {
      localStorage.setItem('medimart_activity', JSON.stringify(recentActivity))
    }
  }, [recentActivity])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Handlers
  const handleLoginSubmit = () => {
    if (userProfile.name && userProfile.age && userProfile.isPregnant) {
      setCurrentScreen('language')
    }
  }

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang)
    setCurrentScreen('dashboard')
  }

  const addActivity = (type: 'scan' | 'chat', title: string) => {
    const newActivity: ActivityItem = {
      id: Date.now().toString(),
      type,
      title,
      timestamp: new Date()
    }
    setRecentActivity(prev => [newActivity, ...prev].slice(0, 3))
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || loading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setLoading(true)

    try {
      // Build context message with user profile
      const contextMessage = `User Profile: ${userProfile.name}, Age: ${userProfile.age}, Pregnant: ${userProfile.isPregnant === 'yes' ? 'Yes (6 months)' : 'No'}, Allergies: ${userProfile.allergies || 'None'}, Conditions: ${userProfile.conditions || 'None'}. Language: ${language}. Question: ${chatInput}`

      const result = await callAIAgent(contextMessage, HEALTH_ASSISTANT_AGENT_ID)

      if (result.success && result.response.result) {
        const assistantData = result.response.result as HealthAssistantResponse
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: assistantData.message || 'No response received',
          data: assistantData,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, assistantMessage])
        addActivity('chat', chatInput.substring(0, 30) + '...')
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I could not process your request. Please try again.',
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'An error occurred. Please try again.',
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickReply = (reply: string) => {
    setChatInput(reply)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleScanMedicine = async () => {
    if (!selectedFile || loading) return

    setLoading(true)
    setScanResult(null)

    try {
      // Upload the image
      const uploadResult = await uploadFiles(selectedFile)

      if (uploadResult.success && uploadResult.asset_ids.length > 0) {
        // Call Medicine Scanner agent with the uploaded file
        const scanMessage = `Please scan this medicine image and provide detailed information about it.`
        const result = await callAIAgent(scanMessage, MEDICINE_SCANNER_AGENT_ID, {
          assets: uploadResult.asset_ids
        })

        if (result.success && result.response.result) {
          const medicineData = result.response.result as MedicineScannerResponse
          setScanResult(medicineData)

          // Automatically pass to Health Assistant with user context
          const healthCheckMessage = `User Profile: ${userProfile.name}, Age: ${userProfile.age}, Pregnant: ${userProfile.isPregnant === 'yes' ? 'Yes (6 months)' : 'No'}, Allergies: ${userProfile.allergies || 'None'}, Conditions: ${userProfile.conditions || 'None'}. I scanned medicine: ${medicineData.medicine_name} (${medicineData.generic_name}). Is this safe for me? ${medicineData.pregnancy_warning}`

          const healthResult = await callAIAgent(healthCheckMessage, HEALTH_ASSISTANT_AGENT_ID)

          if (healthResult.success && healthResult.response.result) {
            const healthData = healthResult.response.result as HealthAssistantResponse

            // Add to chat messages
            const scanChatMessage: ChatMessage = {
              id: Date.now().toString(),
              role: 'user',
              content: `Scanned medicine: ${medicineData.medicine_name}`,
              timestamp: new Date()
            }
            const responseChatMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: healthData.message,
              data: healthData,
              timestamp: new Date()
            }
            setChatMessages(prev => [...prev, scanChatMessage, responseChatMessage])

            addActivity('scan', medicineData.medicine_name)

            // Switch to chat view to show results
            setTimeout(() => setCurrentScreen('chat'), 1000)
          }
        }
      }
    } catch (error) {
      console.error('Scan error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  // Health tips rotation
  const healthTips = [
    'Stay hydrated - drink at least 8 glasses of water daily',
    'Take prescribed medications on time',
    'Regular check-ups are important for your health',
    'Maintain a balanced diet with fruits and vegetables',
    'Get adequate sleep - 7-8 hours recommended'
  ]
  const [currentTip, setCurrentTip] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % healthTips.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const quickReplies = [
    'Is this medicine safe during pregnancy?',
    'What are the side effects?',
    'Can I take this with other medications?',
    'What is the recommended dosage?'
  ]

  // Screen Renders
  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFE8D6] to-[#E8F5F1] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-20 h-20 bg-[#98D8C8] rounded-full flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Medimart Digital Health</CardTitle>
          <p className="text-gray-600 text-base mt-2">Your trusted health companion</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={userProfile.name}
              onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
              className="text-base h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <Input
              type="number"
              placeholder="Enter your age"
              value={userProfile.age}
              onChange={(e) => setUserProfile(prev => ({ ...prev, age: e.target.value }))}
              className="text-base h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Are you pregnant?</label>
            <select
              value={userProfile.isPregnant}
              onChange={(e) => setUserProfile(prev => ({ ...prev, isPregnant: e.target.value as 'yes' | 'no' }))}
              className="w-full h-12 px-3 rounded-md border border-gray-300 text-base"
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Known Allergies</label>
            <Input
              type="text"
              placeholder="e.g., Penicillin, Aspirin (optional)"
              value={userProfile.allergies}
              onChange={(e) => setUserProfile(prev => ({ ...prev, allergies: e.target.value }))}
              className="text-base h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
            <Input
              type="text"
              placeholder="e.g., Diabetes, Hypertension (optional)"
              value={userProfile.conditions}
              onChange={(e) => setUserProfile(prev => ({ ...prev, conditions: e.target.value }))}
              className="text-base h-12"
            />
          </div>
          <Button
            onClick={handleLoginSubmit}
            disabled={!userProfile.name || !userProfile.age || !userProfile.isPregnant}
            className="w-full h-12 bg-[#98D8C8] hover:bg-[#7BC4B4] text-white text-base font-semibold rounded-full mt-4"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderLanguageSelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FFE8D6] to-[#E8F5F1] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">Select Your Language</CardTitle>
          <p className="text-gray-600 text-base mt-2">अपनी भाषा चुनें</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            onClick={() => handleLanguageSelect('hindi')}
            className="w-full h-24 border-2 border-gray-300 hover:border-[#F7786B] rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-800 transition-all hover:shadow-lg"
          >
            हिंदी
          </button>
          <button
            onClick={() => handleLanguageSelect('english')}
            className="w-full h-24 border-2 border-gray-300 hover:border-[#F7786B] rounded-2xl flex items-center justify-center text-2xl font-bold text-gray-800 transition-all hover:shadow-lg"
          >
            English
          </button>
        </CardContent>
      </Card>
    </div>
  )

  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-[#E8F5F1]">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#98D8C8] rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Hello, {userProfile.name}!</h2>
              <p className="text-sm text-gray-600">How can I help you today?</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('language')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Globe className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Health Tips Card */}
        <Card className="bg-[#98D8C8] text-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Health Tip of the Day</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base">{healthTips[currentTip]}</p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentScreen('scan')}
            className="h-32 bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center gap-3 hover:shadow-xl transition-all border-2 border-transparent hover:border-[#98D8C8]"
          >
            <div className="w-14 h-14 bg-[#98D8C8] rounded-full flex items-center justify-center">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-800">Scan Medicine</span>
          </button>
          <button
            onClick={() => setCurrentScreen('chat')}
            className="h-32 bg-white rounded-2xl shadow-lg flex flex-col items-center justify-center gap-3 hover:shadow-xl transition-all border-2 border-transparent hover:border-[#98D8C8]"
          >
            <div className="w-14 h-14 bg-[#98D8C8] rounded-full flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-800">Ask Question</span>
          </button>
        </div>

        {/* Care & Precautions */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Care & Precautions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {userProfile.isPregnant === 'yes' && (
              <div>
                <button
                  onClick={() => toggleSection('pregnancy')}
                  className="w-full flex items-center justify-between p-4 bg-[#FFF8F0] rounded-xl hover:bg-[#FFE8D6] transition-colors"
                >
                  <span className="font-semibold text-gray-800">Pregnancy Care</span>
                  {expandedSection === 'pregnancy' ? <ChevronUp /> : <ChevronDown />}
                </button>
                {expandedSection === 'pregnancy' && (
                  <div className="p-4 bg-white border-2 border-[#FFF8F0] rounded-xl mt-2">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Take prenatal vitamins daily</li>
                      <li>• Avoid alcohol and smoking</li>
                      <li>• Regular prenatal check-ups</li>
                      <li>• Stay hydrated and eat balanced meals</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div>
              <button
                onClick={() => toggleSection('general')}
                className="w-full flex items-center justify-between p-4 bg-[#FFF8F0] rounded-xl hover:bg-[#FFE8D6] transition-colors"
              >
                <span className="font-semibold text-gray-800">General Health</span>
                {expandedSection === 'general' ? <ChevronUp /> : <ChevronDown />}
              </button>
              {expandedSection === 'general' && (
                <div className="p-4 bg-white border-2 border-[#FFF8F0] rounded-xl mt-2">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Maintain healthy diet</li>
                    <li>• Exercise regularly</li>
                    <li>• Get adequate sleep</li>
                    <li>• Manage stress effectively</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-[#FFF8F0] rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'scan' ? 'bg-[#98D8C8]' : 'bg-[#F7786B]'}`}>
                    {activity.type === 'scan' ? <Camera className="w-5 h-5 text-white" /> : <MessageSquare className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{activity.title}</p>
                    <p className="text-xs text-gray-600">{activity.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderChat = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-[#E8F5F1] flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-10 h-10 bg-[#98D8C8] rounded-full flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Health Assistant</h2>
            <p className="text-xs text-gray-600">Ask me anything about your health</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl w-full mx-auto">
        {chatMessages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-[#98D8C8] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600 text-base">Start a conversation with your health assistant</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map(message => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-[#FFE8D6] text-gray-800' : 'bg-[#D4F1E8] text-gray-800'} rounded-2xl p-4 shadow-md`}>
                  <p className="text-base whitespace-pre-wrap">{message.content}</p>

                  {/* Display structured data for assistant responses */}
                  {message.role === 'assistant' && message.data && (
                    <div className="mt-4 space-y-3">
                      {message.data.pregnancy_alert && (
                        <div className="border-2 border-[#F7786B] bg-[#FFF8F0] rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-[#F7786B]" />
                            <span className="font-bold text-[#F7786B] text-sm">Pregnancy Alert</span>
                          </div>
                          <p className="text-xs text-gray-700">Special precautions needed during pregnancy</p>
                        </div>
                      )}

                      {message.data.risk_level && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600">Risk Level:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            message.data.risk_level === 'HIGH' ? 'bg-[#F7786B] text-white' :
                            message.data.risk_level === 'MODERATE' ? 'bg-orange-400 text-white' :
                            'bg-green-400 text-white'
                          }`}>
                            {message.data.risk_level}
                          </span>
                        </div>
                      )}

                      {message.data.safe_home_remedies && message.data.safe_home_remedies.length > 0 && (
                        <div className="bg-white rounded-xl p-3">
                          <p className="font-semibold text-sm text-gray-800 mb-2">Safe Home Remedies:</p>
                          <ul className="space-y-1">
                            {message.data.safe_home_remedies.map((remedy, i) => (
                              <li key={i} className="text-xs text-gray-700">• {remedy}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {message.data.warning_signs && message.data.warning_signs.length > 0 && (
                        <div className="bg-[#FFF8F0] border border-[#F7786B] rounded-xl p-3">
                          <p className="font-semibold text-sm text-[#F7786B] mb-2">Warning Signs:</p>
                          <ul className="space-y-1">
                            {message.data.warning_signs.map((sign, i) => (
                              <li key={i} className="text-xs text-gray-700">• {sign}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Quick Replies */}
      {chatMessages.length === 0 && (
        <div className="px-4 pb-2 max-w-4xl w-full mx-auto">
          <div className="flex gap-2 flex-wrap">
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleQuickReply(reply)}
                className="px-4 py-2 bg-white border-2 border-[#98D8C8] text-gray-700 text-sm rounded-full hover:bg-[#98D8C8] hover:text-white transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            type="text"
            placeholder="Type your question..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={loading}
            className="flex-1 h-12 text-base"
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !chatInput.trim()}
            className="h-12 w-12 bg-[#98D8C8] hover:bg-[#7BC4B4] rounded-full flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Send className="w-5 h-5 text-white" />}
          </Button>
        </div>
      </div>
    </div>
  )

  const renderScan = () => (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] to-[#E8F5F1]">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-10 h-10 bg-[#F7786B] rounded-full flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Medicine Scanner</h2>
            <p className="text-xs text-gray-600">Upload medicine image for analysis</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Upload Area */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="border-4 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#98D8C8] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-[#F7786B] rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-10 h-10 text-white" />
              </div>
              <p className="text-base font-semibold text-gray-800 mb-2">
                {selectedFile ? selectedFile.name : 'Upload Medicine Image'}
              </p>
              <p className="text-sm text-gray-600">Click to select an image</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {selectedFile && (
              <Button
                onClick={handleScanMedicine}
                disabled={loading}
                className="w-full h-12 bg-[#F7786B] hover:bg-[#E56858] text-white text-base font-semibold rounded-full mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Scanning...
                  </>
                ) : (
                  'Scan Medicine'
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Scan Results */}
        {scanResult && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">Scan Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{scanResult.medicine_name}</h3>
                <p className="text-sm text-gray-600">{scanResult.generic_name}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-[#98D8C8] text-white text-xs font-semibold rounded-full">
                  {scanResult.category}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Uses:</h4>
                <ul className="space-y-1">
                  {scanResult.uses.map((use, i) => (
                    <li key={i} className="text-sm text-gray-700">• {use}</li>
                  ))}
                </ul>
              </div>

              {scanResult.pregnancy_warning && (
                <div className="border-2 border-[#F7786B] bg-[#FFF8F0] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-[#F7786B]" />
                    <h4 className="font-bold text-[#F7786B]">Pregnancy Warning</h4>
                  </div>
                  <p className="text-sm text-gray-700">{scanResult.pregnancy_warning}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Side Effects:</h4>
                <ul className="space-y-1">
                  {scanResult.side_effects.map((effect, i) => (
                    <li key={i} className="text-sm text-gray-700">• {effect}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Contraindications:</h4>
                <ul className="space-y-1">
                  {scanResult.contraindications.map((contra, i) => (
                    <li key={i} className="text-sm text-gray-700">• {contra}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#FFF8F0] rounded-xl p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Note:</span> {scanResult.dosage_note}
                </p>
              </div>

              <Button
                onClick={() => setCurrentScreen('chat')}
                className="w-full h-12 bg-[#98D8C8] hover:bg-[#7BC4B4] text-white text-base font-semibold rounded-full"
              >
                View Health Assessment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  // Render current screen
  return (
    <>
      {currentScreen === 'login' && renderLogin()}
      {currentScreen === 'language' && renderLanguageSelection()}
      {currentScreen === 'dashboard' && renderDashboard()}
      {currentScreen === 'chat' && renderChat()}
      {currentScreen === 'scan' && renderScan()}
    </>
  )
}
