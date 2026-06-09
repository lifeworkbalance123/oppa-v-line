import './FeedbackButton.css'

const FEEDBACK_EMAIL = 'oppavline@gmail.com'
const FEEDBACK_SUBJECT = 'Oppa V-Line Feedback'

function FeedbackButton() {
  const mailtoHref = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(FEEDBACK_SUBJECT)}`

  return (
    <a
      href={mailtoHref}
      className="feedback-button"
      aria-label="Send feedback via email"
      title="Send feedback"
    >
      <span className="feedback-button__icon" aria-hidden="true">
        💬
      </span>
    </a>
  )
}

export default FeedbackButton
