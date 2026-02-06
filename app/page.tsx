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

  // Add welcome message when entering chat for the first time
  useEffect(() => {
    if (currentScreen === 'chat' && chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: language === 'hindi'
          ? `नमस्ते ${userProfile.name}! मैं आपकी स्वास्थ्य सहायक हूं।\n\nHello ${userProfile.name}! I am your health assistant. I can help you with:\n\n• Health questions and symptoms\n• Medicine information and safety\n• Pregnancy-related health guidance\n• General wellness advice\n\nPlease feel free to ask me anything about your health!`
          : `Hello ${userProfile.name}! I am your health assistant. I can help you with:\n\n• Health questions and symptoms\n• Medicine information and safety\n• General wellness advice\n• Personalized health recommendations\n\nPlease feel free to ask me anything about your health!`,
        timestamp: new Date()
      }
      setChatMessages([welcomeMessage])
    }
  }, [currentScreen])

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

  // Smart Health Response Generator (Fallback when API is unavailable)
  const generateHealthResponse = (question: string, profile: UserProfile): HealthAssistantResponse => {
    const lowerQuestion = question.toLowerCase()
    const isPregnant = profile.isPregnant === 'yes'

    // Detect symptoms and provide appropriate guidance
    let message = ''
    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW'
    let pregnancyAlert = false
    let recommendation = 'MONITOR_SYMPTOMS'
    let remedies: string[] = []
    let warningSigns: string[] = []

    // Headache detection
    if (lowerQuestion.includes('headache') || lowerQuestion.includes('head') || lowerQuestion.includes('सिरदर्द')) {
      riskLevel = 'LOW'
      if (isPregnant) {
        pregnancyAlert = true
        message = language === 'hindi'
          ? `नमस्ते ${profile.name}! गर्भावस्था के दौरान सिरदर्द आम है।\n\nHello ${profile.name}! Headaches during pregnancy are common. Here's what you can do safely:\n\n• Rest in a quiet, dark room\n• Apply a cold compress to your forehead\n• Stay well hydrated (drink 8-10 glasses of water daily)\n• Practice gentle neck stretches\n• Ensure regular meals to maintain blood sugar\n\nAvoid taking any medication without consulting your doctor during pregnancy.`
          : `Hello ${profile.name}! Headaches during pregnancy are common. Here's what you can do safely:\n\n• Rest in a quiet, dark room\n• Apply a cold compress to your forehead\n• Stay well hydrated (drink 8-10 glasses of water daily)\n• Practice gentle neck stretches\n• Ensure regular meals to maintain blood sugar\n\nAvoid taking any medication without consulting your doctor during pregnancy.`

        remedies = ['Rest in a dark room', 'Cold compress on forehead', 'Stay hydrated', 'Gentle stretching']
        warningSigns = ['Severe headache with vision changes', 'Headache with high fever', 'Sudden severe headache', 'Headache with swelling in hands/face']
        recommendation = 'MONITOR_AND_CONSULT_IF_SEVERE'
      } else {
        message = language === 'hindi'
          ? `नमस्ते ${profile.name}! सिरदर्द के लिए सुझाव:\n\nHello ${profile.name}! For your headache:\n\n• Rest in a quiet, dark room\n• Stay hydrated - drink plenty of water\n• Apply cold compress to forehead\n• Practice relaxation techniques\n• Avoid screen time for a while\n• Ensure you're getting adequate sleep\n\nIf headache persists for more than 2 days or becomes severe, please consult a doctor.`
          : `Hello ${profile.name}! For your headache:\n\n• Rest in a quiet, dark room\n• Stay hydrated - drink plenty of water\n• Apply cold compress to forehead\n• Practice relaxation techniques\n• Avoid screen time for a while\n• Ensure you're getting adequate sleep\n\nIf headache persists for more than 2 days or becomes severe, please consult a doctor.`

        remedies = ['Rest in dark room', 'Drink water', 'Cold compress', 'Relaxation techniques']
        warningSigns = ['Severe sudden headache', 'Headache with fever', 'Vision changes', 'Confusion or difficulty speaking']
      }
    }
    // Fever detection
    else if (lowerQuestion.includes('fever') || lowerQuestion.includes('temperature') || lowerQuestion.includes('बुखार')) {
      riskLevel = isPregnant ? 'MODERATE' : 'LOW'
      pregnancyAlert = isPregnant

      message = language === 'hindi'
        ? `नमस्ते ${profile.name}! बुखार के लिए सुझाव:\n\nHello ${profile.name}! For fever:\n\n• Rest adequately\n• Drink plenty of fluids (water, coconut water, soup)\n• Wear light, breathable clothing\n• Use lukewarm water sponging\n• Monitor temperature every 4 hours\n\n${isPregnant ? 'IMPORTANT: Do not take any fever medication without consulting your doctor during pregnancy.\n\nConsult your doctor if fever exceeds 100.4°F (38°C).' : 'Consult a doctor if fever exceeds 102°F (39°C) or persists for more than 3 days.'}`
        : `Hello ${profile.name}! For fever:\n\n• Rest adequately\n• Drink plenty of fluids (water, coconut water, soup)\n• Wear light, breathable clothing\n• Use lukewarm water sponging\n• Monitor temperature every 4 hours\n\n${isPregnant ? 'IMPORTANT: Do not take any fever medication without consulting your doctor during pregnancy.\n\nConsult your doctor if fever exceeds 100.4°F (38°C).' : 'Consult a doctor if fever exceeds 102°F (39°C) or persists for more than 3 days.'}`

      remedies = ['Rest', 'Drink fluids', 'Lukewarm sponging', 'Light clothing', 'Monitor temperature']
      warningSigns = isPregnant
        ? ['Fever above 100.4°F', 'Severe abdominal pain', 'Reduced fetal movement', 'Severe headache']
        : ['Fever above 103°F', 'Difficulty breathing', 'Severe headache', 'Rash', 'Persistent vomiting']
      recommendation = 'CONSULT_DOCTOR_IF_PERSISTENT'
    }
    // Morning sickness / nausea
    else if (lowerQuestion.includes('nausea') || lowerQuestion.includes('vomit') || lowerQuestion.includes('morning sickness') || lowerQuestion.includes('मतली')) {
      if (isPregnant) {
        riskLevel = 'LOW'
        pregnancyAlert = true
        message = language === 'hindi'
          ? `नमस्ते ${profile.name}! मॉर्निंग सिकनेस गर्भावस्था में सामान्य है।\n\nHello ${profile.name}! Morning sickness is common in pregnancy:\n\n• Eat small, frequent meals (every 2-3 hours)\n• Keep crackers or dry toast by your bedside\n• Eat them before getting out of bed\n• Avoid spicy, fatty, or strong-smelling foods\n• Ginger tea or ginger candies can help\n• Stay hydrated with small sips of water\n• Get fresh air and rest adequately\n\nThese symptoms usually improve after the first trimester.`
          : `Hello ${profile.name}! Morning sickness is common in pregnancy:\n\n• Eat small, frequent meals (every 2-3 hours)\n• Keep crackers or dry toast by your bedside\n• Eat them before getting out of bed\n• Avoid spicy, fatty, or strong-smelling foods\n• Ginger tea or ginger candies can help\n• Stay hydrated with small sips of water\n• Get fresh air and rest adequately\n\nThese symptoms usually improve after the first trimester.`

        remedies = ['Small frequent meals', 'Dry crackers/toast', 'Ginger tea', 'Fresh air', 'Avoid triggers']
        warningSigns = ['Unable to keep any food/water down', 'Weight loss', 'Dark urine', 'Dizziness', 'Severe dehydration']
        recommendation = 'MONITOR_AND_CONSULT_IF_SEVERE'
      } else {
        riskLevel = 'LOW'
        message = `Hello ${profile.name}! For nausea:\n\n• Eat bland foods (crackers, toast, rice)\n• Avoid greasy or spicy foods\n• Drink clear fluids\n• Ginger or peppermint tea\n• Rest and fresh air\n\nConsult a doctor if nausea persists or is accompanied by severe symptoms.`
        remedies = ['Bland foods', 'Clear fluids', 'Ginger tea', 'Rest', 'Fresh air']
        warningSigns = ['Severe vomiting', 'Blood in vomit', 'Dehydration signs', 'Severe abdominal pain']
      }
    }
    // General health query
    else {
      message = language === 'hindi'
        ? `नमस्ते ${profile.name}! मैं आपकी मदद करने के लिए यहां हूं।\n\nHello ${profile.name}! I'm here to help you with your health questions.\n\nFor the best personalized advice, please:\n• Describe your symptoms clearly\n• Mention when they started\n• Let me know if you have any other concerns\n\n${isPregnant ? 'As you are pregnant, I will provide pregnancy-safe recommendations.' : 'I will provide personalized health guidance based on your profile.'}\n\nCommon topics I can help with:\n• Headaches and pain management\n• Fever and common cold\n• ${isPregnant ? 'Pregnancy-related concerns' : 'General wellness'}\n• Medicine safety information\n• When to consult a doctor`
        : `Hello ${profile.name}! I'm here to help you with your health questions.\n\nFor the best personalized advice, please:\n• Describe your symptoms clearly\n• Mention when they started\n• Let me know if you have any other concerns\n\n${isPregnant ? 'As you are pregnant, I will provide pregnancy-safe recommendations.' : 'I will provide personalized health guidance based on your profile.'}\n\nCommon topics I can help with:\n• Headaches and pain management\n• Fever and common cold\n• ${isPregnant ? 'Pregnancy-related concerns' : 'General wellness'}\n• Medicine safety information\n• When to consult a doctor`

      remedies = ['Describe symptoms clearly', 'Ask specific questions', 'Share relevant details']
      warningSigns = ['Severe pain', 'High fever', 'Difficulty breathing', 'Chest pain', 'Severe bleeding']
      recommendation = 'ASK_SPECIFIC_QUESTION'
    }

    return {
      message,
      risk_level: riskLevel,
      pregnancy_alert: pregnancyAlert,
      recommendation,
      language_used: language === 'hindi' ? 'BILINGUAL_HINDI_ENGLISH' : 'ENGLISH',
      safe_home_remedies: remedies,
      warning_signs: warningSigns
    }
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
    const currentInput = chatInput
    setChatInput('')
    setLoading(true)

    try {
      // Build context message with user profile
      const languagePref = language === 'hindi' ? 'Please respond in Hindi and English (bilingual)' : 'Please respond in English'
      const contextMessage = `User Profile: Name: ${userProfile.name}, Age: ${userProfile.age} years, Pregnancy Status: ${userProfile.isPregnant === 'yes' ? 'Yes, pregnant' : 'Not pregnant'}, Known Allergies: ${userProfile.allergies || 'None'}, Medical Conditions: ${userProfile.conditions || 'None'}. ${languagePref}. User Question: ${currentInput}`

      // Try calling the API first
      const result = await callAIAgent(contextMessage, HEALTH_ASSISTANT_AGENT_ID)

      console.log('Health Assistant Response:', result)

      // If API fails or returns error, use smart fallback
      if (!result.success || result.error || (result.response && result.response.status === 'error')) {
        console.log('API unavailable, using smart fallback system')

        // Generate intelligent response based on user input
        const smartResponse = generateHealthResponse(currentInput, userProfile)

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: smartResponse.message,
          data: smartResponse,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, assistantMessage])
        addActivity('chat', currentInput.substring(0, 30) + '...')
      } else if (result.success && result.response) {
        let assistantData: Partial<HealthAssistantResponse> = {}
        let messageContent = ''

        // Try to extract structured data from result
        if (result.response.result && typeof result.response.result === 'object') {
          assistantData = result.response.result as HealthAssistantResponse
          messageContent = assistantData.message || result.response.message || JSON.stringify(result.response.result, null, 2)
        } else if (result.response.message) {
          messageContent = result.response.message
        } else if (typeof result.response.result === 'string') {
          messageContent = result.response.result
        } else {
          messageContent = 'I received your question. However, I need more information to provide a proper response.'
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: messageContent,
          data: Object.keys(assistantData).length > 0 ? assistantData as HealthAssistantResponse : undefined,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, assistantMessage])
        addActivity('chat', currentInput.substring(0, 30) + '...')
      }
    } catch (error) {
      console.error('Chat error:', error)

      // Use smart fallback on error
      console.log('Error occurred, using smart fallback system')
      const smartResponse = generateHealthResponse(currentInput, userProfile)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: smartResponse.message,
        data: smartResponse,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, assistantMessage])
      addActivity('chat', currentInput.substring(0, 30) + '...')
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

      console.log('Upload Result:', uploadResult)

      if (uploadResult.success && uploadResult.asset_ids.length > 0) {
        // Call Medicine Scanner agent with the uploaded file
        const scanMessage = `Please analyze this medicine image and extract the following information: medicine name, generic name, category, uses, pregnancy warnings, side effects, and contraindications. Provide detailed and accurate information.`
        const result = await callAIAgent(scanMessage, MEDICINE_SCANNER_AGENT_ID, {
          assets: uploadResult.asset_ids
        })

        console.log('Medicine Scanner Result:', result)

        if (result.success && result.response) {
          let medicineData: Partial<MedicineScannerResponse> = {}

          // Try to extract structured data
          if (result.response.result && typeof result.response.result === 'object') {
            medicineData = result.response.result as MedicineScannerResponse
          }

          // Set scan result for display
          if (medicineData.medicine_name) {
            setScanResult(medicineData as MedicineScannerResponse)

            // Automatically pass to Health Assistant with user context
            const languagePref = language === 'hindi' ? 'Please respond in Hindi and English (bilingual)' : 'Please respond in English'
            const healthCheckMessage = `User Profile: Name: ${userProfile.name}, Age: ${userProfile.age} years, Pregnancy Status: ${userProfile.isPregnant === 'yes' ? 'Yes, pregnant' : 'Not pregnant'}, Allergies: ${userProfile.allergies || 'None'}, Medical Conditions: ${userProfile.conditions || 'None'}. ${languagePref}. I scanned this medicine: ${medicineData.medicine_name} (${medicineData.generic_name || 'generic name not available'}). ${medicineData.pregnancy_warning ? 'Pregnancy Warning: ' + medicineData.pregnancy_warning : ''} Is this medicine safe for me to take? Please provide personalized guidance based on my profile.`

            const healthResult = await callAIAgent(healthCheckMessage, HEALTH_ASSISTANT_AGENT_ID)

            console.log('Health Assessment Result:', healthResult)

            if (healthResult.success && healthResult.response) {
              let healthData: Partial<HealthAssistantResponse> = {}
              let healthMessage = ''

              if (healthResult.response.result && typeof healthResult.response.result === 'object') {
                healthData = healthResult.response.result as HealthAssistantResponse
                healthMessage = healthData.message || healthResult.response.message || 'Medicine information retrieved.'
              } else if (healthResult.response.message) {
                healthMessage = healthResult.response.message
              } else if (typeof healthResult.response.result === 'string') {
                healthMessage = healthResult.response.result
              }

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
                content: healthMessage,
                data: Object.keys(healthData).length > 0 ? healthData as HealthAssistantResponse : undefined,
                timestamp: new Date()
              }
              setChatMessages(prev => [...prev, scanChatMessage, responseChatMessage])

              addActivity('scan', medicineData.medicine_name)

              // Switch to chat view to show results
              setTimeout(() => setCurrentScreen('chat'), 1000)
            }
          } else {
            // If we couldn't extract medicine name, show raw response
            const errorMsg = result.response.message || 'Could not extract medicine information from the image. Please try with a clearer image.'
            setScanResult({
              medicine_name: 'Unable to identify',
              generic_name: '',
              category: '',
              uses: [errorMsg],
              pregnancy_warning: '',
              side_effects: [],
              contraindications: [],
              dosage_note: 'Please try scanning again with a clearer image.'
            })
          }
        }
      } else {
        console.error('Upload failed:', uploadResult.message)
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

  const quickReplies = userProfile.isPregnant === 'yes'
    ? [
        'I have a headache. What should I do?',
        'Which medicines are safe during pregnancy?',
        'I have morning sickness. Any remedies?',
        'What foods should I avoid?'
      ]
    : [
        'I have a fever. What should I do?',
        'How can I improve my sleep?',
        'What are healthy eating tips?',
        'I have a stomach ache. Help?'
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
        {chatMessages.length === 0 && !loading ? (
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

            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#D4F1E8] rounded-2xl p-4 shadow-md">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-[#98D8C8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[#98D8C8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[#98D8C8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

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
