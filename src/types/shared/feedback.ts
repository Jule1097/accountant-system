import { feedbackTypes } from "src/lib/constants/feedback"

export type FeedbackType = typeof feedbackTypes[keyof typeof feedbackTypes]

export interface FeedbackDescriptor {
  type: FeedbackType
  title: string
  description: string
}
