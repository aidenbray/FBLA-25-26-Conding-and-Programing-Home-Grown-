/**
 * Chatbot Widget Component
 * 
 * Provides an interactive AI-powered chatbot interface for helping users:
 * - Find businesses by category, name, or features
 * - Get information about deals and promotions
 * - Learn how to use application features
 * - Navigate to specific businesses
 * 
 * Features:
 * - Collapsible widget interface (doesn't obstruct content)
 * - Natural language processing via chatbotService
 * - Clickable business suggestions
 * - Message history within session
 * - Keyboard accessible
 * 
 * UI Components:
 * - Toggle button (💬) - Opens/closes chat window
 * - Chat window - Message display and input area
 * - Message bubbles - User and bot messages styled differently
 * - Business cards - Clickable recommendations in chat
 * 
 * @module components/chatbotWidget
 * @requires ../services/chatbotService.js - Natural language processing and response generation
 */

import { handleUserQuery } from '../services/chatbotService.js'

/**
 * Initialize Chatbot Widget
 * 
 * Finds the chatbot container element and renders the complete chatbot interface.
 * Safe to call even if container doesn't exist (gracefully degrades).
 * 
 * Should be called during application initialization (main.js).
 * 
 * Container Element:
 * - Must have ID 'chatbot-container'
 * - Typically positioned fixed at bottom-right of viewport
 * - Separate from main app container to maintain independent positioning
 * 
 * @function
 * @export
 * @returns {void}
 */
export function initChatbot() {
  // Locate the designated chatbot container in the DOM
  const container = document.getElementById('chatbot-container')
  
  // If container doesn't exist, exit gracefully (may be disabled or missing)
  if (!container) return

  // Render the chatbot UI into the container
  renderChatbot(container)
}

/**
 * Render Chatbot Interface
 * 
 * Creates the complete chatbot UI with all interactive elements and event handlers.
 * Implements accessibility features (ARIA labels, roles, keyboard navigation).
 * 
 * UI Structure:
 * - Toggle Button: Fixed position button to open/close chat
 * - Chat Window: Modal-style dialog containing:
 *   - Header: Title and close button
 *   - Messages Area: Scrollable message history (user and bot)
 *   - Input Area: Text input and send button (form for Enter key support)
 * 
 * Initial State:
 * - Chat window hidden by default
 * - Toggle button visible
 * - Greeting message added automatically
 * 
 * Accessibility:
 * - ARIA labels for screen readers
 * - role="dialog" for chat window
 * - role="log" with aria-live for message announcements
 * - Keyboard navigation support
 * 
 * @function
 * @private
 * @param {HTMLElement} container - Container element to render chatbot into
 * @returns {void}
 */
function renderChatbot(container) {
  // Render complete chatbot HTML structure
  container.innerHTML = `
    <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Open Chat Assistant">💬</button>
    <div id="chatbot-window" class="chatbot-window" style="display: none;" role="dialog" aria-label="Chat Assistant">
      <div class="chatbot-header">
        <span>Assistant</span>
        <button id="chatbot-close" class="chatbot-close" aria-label="Close Chat">×</button>
      </div>
      <div id="chatbot-messages" class="chatbot-messages" role="log" aria-live="polite"></div>
      <form id="chatbot-form" class="chatbot-input-area">
        <input type="text" id="chatbot-input" placeholder="Ask me anything..." autocomplete="off" aria-label="Chat message" />
        <button type="submit" aria-label="Send message">➤</button>
      </form>
    </div>
  `

  // Get references to all interactive elements
  const toggleBtn = document.getElementById('chatbot-toggle')
  const closeBtn = document.getElementById('chatbot-close')
  const windowEl = document.getElementById('chatbot-window')
  const form = document.getElementById('chatbot-form')
  const input = document.getElementById('chatbot-input')
  const messagesContainer = document.getElementById('chatbot-messages')

  // Add initial greeting message - helps users understand chatbot capabilities
  addBotMessage(messagesContainer, "Hi! I can help you find businesses, deals, or explain features. Try asking 'Show me coffee shops'!")

  // Toggle button click handler - shows/hides chat window
  toggleBtn.addEventListener('click', () => {
    const isHidden = windowEl.style.display === 'none'
    windowEl.style.display = isHidden ? 'flex' : 'none'
    if (isHidden) {
      input.focus() // Auto-focus input for immediate typing
    }
  })

  // Close button click handler
  closeBtn.addEventListener('click', () => {
    windowEl.style.display = 'none'
  })

  // Form submit handler - processes user messages
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const text = input.value.trim()
    if (!text) return

    addUserMessage(messagesContainer, text)
    input.value = ''

    // Simulate thinking delay slightly for UX (300ms)
    setTimeout(async () => {
      const response = await handleUserQuery(text)
      addBotMessage(messagesContainer, response.text, response.data)
    }, 300)
  })
}

/**
 * Add User Message to Chat
 * 
 * Creates and displays a user message bubble in the chat interface.
 * Automatically scrolls to show the new message.
 * 
 * @function
 * @private
 * @param {HTMLElement} container - Messages container element
 * @param {string} text - User message text to display
 * @returns {void}
 */
function addUserMessage(container, text) {
  const msgDiv = document.createElement('div')
  msgDiv.className = 'message user'
  msgDiv.textContent = text
  container.appendChild(msgDiv)
  scrollToBottom(container)
}

/**
 * Add Bot Message to Chat
 * 
 * Creates and displays a bot message bubble with optional interactive business cards.
 * Supports rich content display for search results.
 * 
 * @function
 * @private
 * @param {HTMLElement} container - Messages container element
 * @param {string} text - Bot response text
 * @param {Array<Object>} [data=null] - Optional array of business objects to display as cards
 * @returns {void}
 */
function addBotMessage(container, text, data = null) {
  const msgDiv = document.createElement('div')
  msgDiv.className = 'message bot'
  
  const textP = document.createElement('p')
  textP.style.margin = '0'
  textP.textContent = text
  msgDiv.appendChild(textP)

  // Add interactive business cards if data provided
  if (data && Array.isArray(data) && data.length > 0) {
    const list = document.createElement('div')
    list.className = 'chat-business-list'
    
    data.forEach(item => {
      const itemDiv = document.createElement('div')
      itemDiv.className = 'chat-business-item'
      itemDiv.innerHTML = `<strong>${item.name}</strong>${item.category} ${item.rating ? '⭐ ' + item.rating : ''}`
      itemDiv.onclick = () => {
        location.hash = `#/business/${item.id}`
        // Optional: close chat on selection
        // document.getElementById('chatbot-window').style.display = 'none'
      }
      list.appendChild(itemDiv)
    })
    msgDiv.appendChild(list)
  }

  container.appendChild(msgDiv)
  scrollToBottom(container)
}

/**
 * Scroll Chat to Bottom
 * 
 * Automatically scrolls the messages container to show the latest message.
 * Essential for good UX - users should always see new messages without manual scrolling.
 * 
 * @function
 * @private
 * @param {HTMLElement} container - Messages container element to scroll
 * @returns {void}
 */
function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight
}
