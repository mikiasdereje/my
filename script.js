const chatContainer = document.getElementById('chatContainer');
const welcomeScreen = document.getElementById('welcomeScreen');
const examplePrompts = document.getElementById('examplePrompts');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const newChatBtn = document.getElementById('newChatBtn');
const creatorInfoBtn = document.querySelector('.creator-info-btn');
const creatorInfoModal = document.getElementById('creatorInfoModal');
const toast = document.getElementById('toast');
const micButton = document.getElementById('micButton');
const voiceSelect = document.getElementById('voiceSelect'); // Only declare ONCE here
let availableVoices = []; // Only declare ONCE here

// Gemini API Key and Endpoint
const GEMINI_API_KEY = "AIzaSyBjTNLLlkAiTEYinmfREes63K1Ql2vc26I";
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// Mock AI fallback responses
const MOCK_AI_RESPONSES = [
  "I'm MY, your futuristic AI assistant created by MIKIAS. How can I help you today?",
  "That's an interesting question. Let me think about it...",
  "Based on my analysis, I would recommend considering these options...",
  "I've processed your request and found some relevant information.",
  "The answer to your question involves several factors. Let me explain...",
  "I'm designed by MIKIAS to assist with a wide range of tasks. What else would you like to know?"
];

// State
let messages = [];
let isTyping = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Show welcome toast
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
    setTimeout(() => {
      toast.style.transform = 'translateX(150%)';
    }, 5000);
  }, 1000);

  // Example prompt buttons
  document.querySelectorAll('.example-prompt-btn').forEach(button => {
    button.addEventListener('click', () => {
      handleSendMessage(button.textContent);
    });
  });

  // Message form submission
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message && !isTyping) {
      handleSendMessage(message);
    }
  });

  // Enable/disable send button based on input
  messageInput.addEventListener('input', () => {
    sendButton.disabled = messageInput.value.trim() === '';
  });

  // New chat button
  newChatBtn.addEventListener('click', () => {
    handleNewChat();
  });

  // Creator info modal
  creatorInfoBtn.addEventListener('click', () => {
    toggleCreatorModal();
  });

  // Close modal when clicking outside
  document.addEventListener('click', (e) => {
    if (creatorInfoModal.style.display === 'block' &&
        !creatorInfoModal.contains(e.target) &&
        !creatorInfoBtn.contains(e.target)) {
      toggleCreatorModal();
    }
  });

  // Speech recognition
  let recognition;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    micButton.addEventListener('click', () => {
      micButton.classList.add('listening');
      recognition.start();
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      messageInput.value = transcript;
      micButton.classList.remove('listening');
      // Optionally, auto-enable send button or auto-submit
    };

    recognition.onend = () => {
      micButton.classList.remove('listening');
    };
  } else {
    micButton.disabled = true;
    micButton.title = "Speech recognition not supported";
  }
  
  // Add after DOMContentLoaded
  function populateVoiceList() {
    availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('en'));
    voiceSelect.innerHTML = '';
    let defaultIndex = 0;
    availableVoices.forEach((voice, i) => {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' [default]' : ''}`;
      // Set default to Android speech recognition and synthesis from Google en-u-e-x-iom-network en-US if available
      if (
        voice.name.toLowerCase().includes('android speech recognition and synthesis from google') &&
        voice.name.toLowerCase().includes('en-u-e-x-iom-network') &&
        voice.lang.toLowerCase() === 'en-us'
      ) {
        defaultIndex = i;
      }
      voiceSelect.appendChild(option);
    });
    voiceSelect.selectedIndex = defaultIndex;
  }

  // Some browsers load voices asynchronously
  window.speechSynthesis.onvoiceschanged = populateVoiceList;
  populateVoiceList();

  const voiceBtn = document.getElementById('voiceSelectBtn');
  const voiceDropdown = document.getElementById('voiceDropdown');

  voiceBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    voiceDropdown.style.display = voiceDropdown.style.display === 'block' ? 'none' : 'block';
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!voiceDropdown.contains(e.target) && e.target !== voiceBtn) {
      voiceDropdown.style.display = 'none';
    }
  });

  // Use the selected voice in your read aloud logic!
  window.getSelectedVoice = () => {
    const idx = voiceSelect.value;
    return availableVoices[idx];
  };

  const menuBtn = document.getElementById('menuBtn');
  const navActions = document.getElementById('navActions');

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navActions.classList.toggle('open');
  });

  // Hide menu when clicking outside (on mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 640 && navActions.classList.contains('open')) {
      if (!navActions.contains(e.target) && e.target !== menuBtn) {
        navActions.classList.remove('open');
      }
    }
  });
});

// Start a new chat
function handleNewChat() {
  messages = [];
  updateChatUI();
}

// Handle sending a message
function handleSendMessage(content) {
  const userMessage = {
    id: `user-${Date.now()}`,
    content,
    sender: 'user',
    timestamp: new Date()
  };

  messages.push(userMessage);
  messageInput.value = '';
  sendButton.disabled = true;
  updateChatUI();

  // Choose between mock response or real API call
  if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_API_KEY_HERE") {
    generateAIResponseWithGemini(content);
  } else {
    simulateResponse(content);
  }
}

// Generate mock AI response
function simulateResponse(userMessage) {
  isTyping = true;
  updateChatUI();

  const lowerCaseMessage = userMessage.toLowerCase();

  // Detect if asking about the creator
  const isCreatorQuestion = lowerCaseMessage.includes('create') || 
                          lowerCaseMessage.includes('made') || 
                          lowerCaseMessage.includes('develop') ||
                          lowerCaseMessage.includes('mikias');

  // Detect if asking about the AI identity or capabilities
  const isAIIdentityQuestion = lowerCaseMessage.includes('who are you') ||
                             lowerCaseMessage.includes('what are you') ||
                             lowerCaseMessage.includes('your name') ||
                             lowerCaseMessage.includes('what can you do') ||
                             lowerCaseMessage.includes('are you real') ||
                             lowerCaseMessage.includes('about you');

  const responseTime = Math.floor(Math.random() * 2000) + 1000;

  setTimeout(() => {
    let aiResponse = "";

    if (isCreatorQuestion) {
      aiResponse = "I was created by MIKIAS, a pioneering AI researcher and developer. He designed me to be a futuristic assistant capable of helping with a wide range of tasks.";
    } else if (isAIIdentityQuestion) {
      aiResponse = "I'm MY, your futuristic AI assistant designed to chat, help with tasks, and provide information. I blend personality with intelligence to make every conversation feel human.";
    } else {
      aiResponse = MOCK_AI_RESPONSES[Math.floor(Math.random() * MOCK_AI_RESPONSES.length)];
    }

    const aiMessage = {
      id: `ai-${Date.now()}`,
      content: aiResponse,
      sender: 'ai',
      timestamp: new Date()
    };

    messages.push(aiMessage);
    isTyping = false;
    updateChatUI();
  }, responseTime);
}

// Generate response using Gemini API
// Generate response using Gemini 2.0 Flash API
async function generateAIResponseWithGemini(userInput) {
    isTyping = true;
    updateChatUI();
  
    const lowerCaseMessage = userInput.toLowerCase();
    const isCreatorQuestion = lowerCaseMessage.includes('create') || 
                              lowerCaseMessage.includes('made') || 
                              lowerCaseMessage.includes('develop') ||
                              lowerCaseMessage.includes('mikias');
  
    const isAIIdentityQuestion = lowerCaseMessage.includes('who are you') ||
                                 lowerCaseMessage.includes('what are you') ||
                                 lowerCaseMessage.includes('your name') ||
                                 lowerCaseMessage.includes('what can you do') ||
                                 lowerCaseMessage.includes('are you real') ||
                                 lowerCaseMessage.includes('about you');
  
    if (isCreatorQuestion || isAIIdentityQuestion) {
      let aiResponse = "";
  
      if (isCreatorQuestion) {
        aiResponse = "I was created by MIKIAS, a pioneering AI researcher and developer. He designed me to be a futuristic assistant capable of helping with a wide range of tasks.";
      } else if (isAIIdentityQuestion) {
        aiResponse = "I'm MY, your futuristic AI assistant designed to chat, help with tasks, and provide information. I blend personality with intelligence to make every conversation feel human.";
      }
  
      messages.push({
        id: `ai-${Date.now()}`,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      });
  
      isTyping = false;
      updateChatUI();
      return; // prevent calling the API
    }
  
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: userInput }]
              }
            ]
          })
        }
      );
  
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                     "I couldn't generate a response. Please try again.";
  
      const aiMessage = {
        id: `ai-${Date.now()}`,
        content: aiText,
        sender: 'ai',
        timestamp: new Date()
      };
  
      messages.push(aiMessage);
    } catch (error) {
      console.error("Gemini API Error:", error.message);
      messages.push({
        id: `ai-${Date.now()}`,
        content: "Oops! Something went wrong. Try again later.",
        sender: 'ai',
        timestamp: new Date()
      });
    } finally {
      isTyping = false;
      updateChatUI();
    }
  }
  
function appendAIMessage(markdownText) {
  const chatContainer = document.getElementById('chatContainer');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'ai-message';
  // Convert markdown to HTML
  messageDiv.innerHTML = marked.parse(markdownText);
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Example usage:
// appendAIMessage("**Title**\n\nHere is some text.\n\n```js\nconsole.log('Hello!');\n```");

// Update the chat UI
function updateChatUI() {
  if (messages.length > 0) {
    welcomeScreen.style.display = 'none';
    examplePrompts.style.display = 'none';
  } else {
    welcomeScreen.style.display = 'flex';
    examplePrompts.style.display = 'flex';
    chatContainer.querySelectorAll('.message, .typing-indicator').forEach(el => el.remove());
    return;
  }

  // Clear existing messages
  chatContainer.querySelectorAll('.message, .typing-indicator').forEach(el => el.remove());

  // Add all messages
  messages.forEach((message, index) => {
    const messageEl = createMessageElement(message, index);
    chatContainer.appendChild(messageEl);
  });

  // Add typing indicator if needed
  if (isTyping) {
    const typingIndicator = createTypingIndicator();
    chatContainer.appendChild(typingIndicator);
  }

  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Create a message element
function createMessageElement(message, index) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${message.sender}`;
  messageEl.style.animationDelay = `${index * 100}ms`;

  const content = document.createElement('div');
  content.className = 'message-content';

  const bubbleContainer = document.createElement('div');
  bubbleContainer.className = 'message-bubble-container';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = message.sender === 'ai' ? 'MY' : 'You';

  const bubbleWrapper = document.createElement('div');
  bubbleWrapper.className = 'message-bubble-wrapper';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  // Render AI messages as Markdown
  if (message.sender === 'ai') {
    bubble.innerHTML = marked.parse(message.content);

    // Add copy button to each code block
    bubble.querySelectorAll('pre code').forEach((codeBlock) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      codeBlock.parentNode.parentNode.replaceChild(wrapper, codeBlock.parentNode);
      wrapper.appendChild(codeBlock.parentNode);

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(codeBlock.textContent);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 1200);
      };
      wrapper.appendChild(copyBtn);
    });

    // Track the utterance globally so we can stop it
    let currentUtterance = null;

    // Add Read Aloud button (for the whole answer)
    const readBtn = document.createElement('button');
    readBtn.className = 'read-aloud-btn';
    readBtn.textContent = 'Read';

    const stopBtn = document.createElement('button');
    stopBtn.className = 'read-aloud-btn';
    stopBtn.style.right = '150px';
    stopBtn.textContent = 'Stop ';
    stopBtn.style.display = 'none';

    readBtn.onclick = () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        readBtn.textContent = 'Read';
        stopBtn.style.display = 'none';
        return;
      }
      const utterance = new window.SpeechSynthesisUtterance(bubble.textContent);
      const selectedVoiceIndex = voiceSelect.value;
      if (availableVoices[selectedVoiceIndex]) {
        utterance.voice = availableVoices[selectedVoiceIndex];
      }
      const selectedVoice = window.getSelectedVoice && window.getSelectedVoice();
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.pitch = 0.6;
      utterance.rate = 0.95;
      utterance.volume = 1;
      utterance.lang = 'en-US';

      currentUtterance = utterance;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      readBtn.textContent = 'Playing...';
      stopBtn.style.display = 'inline-block';
      utterance.onend = () => {
        readBtn.textContent = 'Read';
        stopBtn.style.display = 'none';
        currentUtterance = null;
      };
      utterance.onerror = () => {
        readBtn.textContent = 'Read';
        stopBtn.style.display = 'none';
        currentUtterance = null;
        // No alert, just reset UI
      };
    };

    stopBtn.onclick = () => {
      window.speechSynthesis.cancel();
      readBtn.textContent = 'Read';
      stopBtn.style.display = 'none';
      currentUtterance = null;
    };

    bubble.appendChild(readBtn);
    bubble.appendChild(stopBtn);
  } else {
    bubble.textContent = message.content;
  }

  const timestamp = document.createElement('div');
  timestamp.className = 'message-timestamp';
  timestamp.textContent = formatTime(message.timestamp);

  bubbleWrapper.appendChild(bubble);
  bubbleWrapper.appendChild(timestamp);
  bubbleContainer.appendChild(avatar);
  bubbleContainer.appendChild(bubbleWrapper);
  content.appendChild(bubbleContainer);
  messageEl.appendChild(content);

  return messageEl;
}

// Create typing indicator
function createTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';

  const content = document.createElement('div');
  content.className = 'typing-content';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = 'MY';

  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'typing-dot';
    dots.appendChild(dot);
  }

  content.appendChild(avatar);
  content.appendChild(dots);
  indicator.appendChild(content);

  return indicator;
}

// Format time
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Toggle creator modal
function toggleCreatorModal() {
  creatorInfoModal.style.display =
    creatorInfoModal.style.display === 'block' ? 'none' : 'block';
}