export {}

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }

  interface SpeechRecognition {
    continuous: boolean
    interimResults: boolean
    lang: string
    start(): void
    stop(): void
    onresult: (event: SpeechRecognitionEvent) => void
    onend: () => void
    onerror: (event: any) => void
  }

  interface SpeechRecognitionEvent {
    readonly results: SpeechRecognitionResultList
  }

  interface SpeechRecognitionResultList {
    readonly length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean
    readonly length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition
    new (): SpeechRecognition
  }

  var webkitSpeechRecognition: {
    prototype: SpeechRecognition
    new (): SpeechRecognition
  }
}
