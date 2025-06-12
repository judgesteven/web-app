import React, { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'

interface SurveyAnswer {
  id: string
  text: string
}

interface SurveyQuestion {
  id: string
  text: string
  type: string
  answers: SurveyAnswer[]
}

interface Survey {
  id: string
  name: string
  description: string
  points: number
  credits: number
  questions: SurveyQuestion[]
}

interface SurveysCardProps {
  accountName: string
  apiKey: string
  playerId: string
  onEventCompleted?: () => void
}

const SurveysCard: React.FC<SurveysCardProps> = ({
  accountName,
  apiKey,
  playerId,
  onEventCompleted
}) => {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchSurvey = useCallback(async () => {
    if (!accountName || !apiKey) {
      console.log('Missing required fields for fetchSurvey')
      return
    }

    setIsLoading(true)
    try {
      const surveyId = '1-test-survey'
      const url = `https://api.gamelayer.co/api/v0/surveys/${surveyId}?account=${encodeURIComponent(accountName)}`
      const headers = {
        'Accept': 'application/json',
        'api-key': apiKey
      }

      console.log('Fetching survey:', { url, headers: { ...headers, 'api-key': '***' } })
      
      const response = await fetch(url, { headers })
      if (!response.ok) {
        throw new Error(`Failed to fetch survey: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Survey data:', data)
      
      setSurvey(data)
    } catch (error) {
      console.error('Error fetching survey:', error)
      toast.error('Failed to load survey')
    } finally {
      setIsLoading(false)
    }
  }, [accountName, apiKey])

  useEffect(() => {
    if (accountName && apiKey) {
      fetchSurvey()
    }
  }, [accountName, apiKey, fetchSurvey])

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setSelectedAnswers(prev => {
      // For now, we'll only support single-select questions
      return {
        ...prev,
        [questionId]: [answerId]
      }
    })
  }

  const handleSubmit = async () => {
    if (!survey || !playerId) return
    
    // Check if all questions have answers
    const unansweredQuestions = survey.questions.filter(q => !selectedAnswers[q.id])
    if (unansweredQuestions.length > 0) {
      toast.error('Please answer all questions')
      return
    }
    
    setIsSubmitting(true)
    try {
      const url = `https://api.gamelayer.co/api/v0/surveys/${survey.id}/complete`
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': apiKey
      }
      
      const answers = Object.entries(selectedAnswers).map(([questionId, answerIds]) => ({
        questionId,
        answerIds
      }))
      
      const body = {
        account: accountName,
        player: playerId,
        answers
      }
      
      console.log('Submitting survey:', { url, body, headers: { ...headers, 'api-key': '***' } })
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to submit survey: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Survey submission response:', data)
      
      toast.success(`Survey completed! You earned ${survey.points} points and ${survey.credits} credits.`)
      
      // Reset selected answers
      setSelectedAnswers({})
      
      // Refresh survey
      fetchSurvey()
      
      // Notify parent component to refresh player data
      if (onEventCompleted) {
        onEventCompleted()
      }
    } catch (error) {
      console.error('Error submitting survey:', error)
      toast.error('Failed to submit survey')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
        <p className="text-gray-500 text-center">No survey available</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
      <h2 className="text-xl font-bold text-gray-800 mb-2">{survey.name}</h2>
      <p className="text-gray-600 mb-4">{survey.description}</p>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-500">Points:</span>
          <span className="text-sm font-bold text-blue-600">{survey.points}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-500">Credits:</span>
          <span className="text-sm font-bold text-green-600">{survey.credits}</span>
        </div>
      </div>
      
      <div className="space-y-6 mb-6">
        {survey.questions.map((question) => (
          <div key={question.id} className="space-y-2">
            <p className="font-medium text-gray-700">{question.text}</p>
            <div className="space-y-2">
              {question.answers.map((answer) => (
                <div 
                  key={answer.id}
                  onClick={() => handleAnswerSelect(question.id, answer.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedAnswers[question.id]?.includes(answer.id)
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 mr-2 rounded-full border ${
                      selectedAnswers[question.id]?.includes(answer.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedAnswers[question.id]?.includes(answer.id) && (
                        <div className="w-2 h-2 mx-auto mt-1 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="text-gray-700">{answer.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || Object.keys(selectedAnswers).length !== survey.questions.length}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-3xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 text-sm"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Survey'}
      </button>
    </div>
  )
}

export default SurveysCard 