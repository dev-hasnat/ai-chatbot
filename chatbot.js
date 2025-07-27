(function(){
  function getApiKey() {
    const scripts = document.getElementsByTagName('script');
    for(let i=0; i<scripts.length; i++) {
      const script = scripts[i];
      if(script.src && script.src.includes('chatbot.js')) {
        return script.getAttribute('data-api-key');
      }
    }
    return null;
  }

  const apiKey = getApiKey();
  if(!apiKey) {
    console.error('API Key not found! Please add data-api-key attribute in script tag.');
    return;
  }

  // CSS styles
  const style = document.createElement('style');
  style.textContent = `
    /* Chat widget styles */
    #chatWidget {
      position: fixed;
      bottom: 90px;
      right: 30px;
      width: 400px;
      max-height: 650px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      z-index: 999999;
      user-select: none;
    }
    #chatWidget .header {
      background: linear-gradient(45deg, #4CAF50, #45a049);
      color: white;
      padding: 20px;
      text-align: center;
      flex-shrink: 0;
    }
    #chatWidget .header h1 {
      font-size: 22px;
      margin-bottom: 5px;
      font-weight: 600;
    }
    #chatWidget .header p {
      opacity: 0.9;
      font-size: 14px;
    }
    #chatContainer {
      flex-grow: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f8f9fa;
    }
    .message {
      margin-bottom: 15px;
      animation: fadeIn 0.3s ease-in;
      word-wrap: break-word;
      max-width: 85%;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .user-message {
      text-align: right;
    }
    .user-message .bubble {
      background: #007bff;
      color: white;
      display: inline-block;
      padding: 10px 15px;
      border-radius: 18px 18px 5px 18px;
    }
    .bot-message .bubble {
      background: #e9e9eb;
      color: #333;
      display: inline-block;
      padding: 10px 15px;
      border-radius: 18px 18px 18px 5px;
    }
    #inputArea {
      padding: 15px;
      background: white;
      border-top: 1px solid #e0e0e0;
      flex-shrink: 0;
    }
    #inputForm {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    #userInput {
      flex: 1;
      padding: 12px 15px;
      border: 1px solid #ccc;
      border-radius: 25px;
      outline: none;
      font-size: 16px;
      min-width: 50px;
      transition: border-color 0.3s;
    }
    #userInput:focus {
      border-color: #007bff;
    }
    #sendBtn {
      background: #007bff;
      color: white;
      border: none;
      padding: 0 22px;
      min-width: 64px;
      height: 44px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      box-sizing: border-box;
      transition: background 0.3s;
    }
    #sendBtn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .typing-dots {
      display: flex;
      align-items: center;
      padding: 5px 0;
    }
    .typing-dots span {
      height: 8px;
      width: 8px;
      background-color: #999;
      border-radius: 50%;
      display: inline-block;
      margin: 0 2px;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    /* Help button */
    #helpButton {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #007bff;
      color: white;
      font-size: 28px;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.3s ease;
    }
    #helpButton:hover {
      background-color: #0056b3;
    }
  `;
  document.head.appendChild(style);

  // Help button তৈরি
  const helpBtn = document.createElement('button');
  helpBtn.id = 'helpButton';
  helpBtn.setAttribute('aria-label', 'Open chat help');
  helpBtn.textContent = '💬';
  document.body.appendChild(helpBtn);

  // Chat widget তৈরি
  const container = document.createElement('div');
  container.id = 'chatWidget';
  container.classList.add('hidden');
  container.style.display = 'none';

  container.innerHTML = `
    <div class="header">
      <h1>Smart Chatbot By Abu Hasnat</h1>
      <p>Ask me anything! I'll try to help you.</p>
    </div>
    <div class="chat-container" id="chatContainer">
      <div class="message bot-message">
        <div class="bubble">👋 Hello! I'm your AI assistant. How can I help you today?</div>
      </div>
    </div>
    <div id="inputArea">
      <form id="inputForm" autocomplete="off">
        <input type="text" id="userInput" class="input-field" placeholder="Type your message here..." required />
        <button type="submit" id="sendBtn">Send</button>
      </form>
    </div>
  `;
  document.body.appendChild(container);

  // DOM এলিমেন্টস
  const chatForm = document.getElementById('inputForm');
  const userInput = document.getElementById('userInput');
  const sendBtn = document.getElementById('sendBtn');
  const chatContainer = document.getElementById('chatContainer');

  // মেসেজ UI তে যোগ করার ফাংশন
  function addMessageToUI(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    messageDiv.appendChild(bubble);
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
  }

  // টাইপিং ইন্ডিকেটর দেখানোর ফাংশন
  function showTypingIndicator() {
    if (document.getElementById('typing-placeholder')) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.id = 'typing-placeholder';

    messageDiv.innerHTML = `
      <div class="bubble">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
  }

  // টাইপিং ইন্ডিকেটর আপডেট করার ফাংশন
  function updateTypingIndicatorWithMessage(text, isError = false) {
    const placeholder = document.getElementById('typing-placeholder');
    if (!placeholder) return;

    const bubble = placeholder.querySelector('.bubble');
    if (!bubble) return;

    bubble.innerHTML = '';
    bubble.textContent = text;

    if (isError) {
      bubble.style.background = '#ffe6e6';
      bubble.style.color = '#d00';
      bubble.style.border = '1px solid #ffcccc';
    }

    placeholder.removeAttribute('id');
  }

  // স্ক্রল বটমে নিয়ে যাওয়ার ফাংশন
  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // হেল্প বাটনে ক্লিক করলে উইজেট দেখানো
  helpBtn.addEventListener('click', () => {
    container.style.display = 'flex';
    helpBtn.style.display = 'none';
    userInput.focus();
  });

  // ইনপুটে টাইপ করলে সেন্ড বাটন সক্রিয়/নিষ্ক্রিয় করা
  userInput.addEventListener('input', () => {
    sendBtn.disabled = userInput.value.trim() === '';
  });

  // ফর্ম সাবমিট হ্যান্ডলার
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    addMessageToUI(message, 'user');
    userInput.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

    showTypingIndicator();

    try {
      const response = await fetch('response.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-API-KEY': apiKey
        },
        body: 'message=' + encodeURIComponent(message)
      });

      const data = await response.text();

      if (response.ok) {
        updateTypingIndicatorWithMessage(data);
      } else {
        updateTypingIndicatorWithMessage('Sorry, I encountered an error.', true);
      }
    } catch (error) {
      updateTypingIndicatorWithMessage('Network error. Check your connection.', true);
    }

    sendBtn.disabled = false;
    sendBtn.textContent = 'Send';
    userInput.focus();
  });

  // এন্টার প্রেস করলে সাবমিট হবে (শিফট+এন্টার নয়)
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendBtn.disabled) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  // মোবাইল কীবোর্ড অপটিমাইজেশন (ঐচ্ছিক)
  function handleKeyboard() {
    if (!window.visualViewport) return;

    const adjustLayout = () => {
      const viewportHeight = window.visualViewport.height;
      document.body.style.height = `${viewportHeight}px`;
      container.style.height = `${viewportHeight}px`;
      scrollToBottom();
    };

    window.visualViewport.addEventListener('resize', adjustLayout);
  }

  if (window.innerWidth <= 768) {
    handleKeyboard();
  }
})();