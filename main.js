class GenerativeAI {
  constructor() {
    this.knowledge = new Map();
    this.context = [];
    this.maxContext = 5;
  }

  async generateResponse(input) {
    const knownResponse = this.knowledge.get(input.toLowerCase());
    if (knownResponse) {
      return knownResponse;
    }

    try {
      const response = await fetch('/api/ai_completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Actúa como una IA amigable y conversacional. Genera una respuesta natural en español a este mensaje del usuario. La respuesta debe ser concisa (máximo 2 oraciones) y mantener un tono amable y curioso.

          interface Response {
            reply: string;
          }

          {
            "reply": "¡Qué interesante perspectiva! Me encantaría saber más sobre tu experiencia con ese tema."
          }
          `,
          data: {
            userMessage: input,
            context: this.context
          }
        })
      });

      const data = await response.json();
      this.learn(input, data.reply);
      return data.reply;
    } catch (error) {
      console.error('Error generando respuesta:', error);
      return this.getDefaultResponse();
    }
  }

  learn(input, response) {
    this.knowledge.set(input.toLowerCase(), response);
    this.context.push({ input, response });
    if (this.context.length > this.maxContext) {
      this.context.shift();
    }
  }

  getDefaultResponse() {
    const responses = [
      "Disculpa, estoy teniendo problemas para procesar eso. ¿Podrías reformularlo?",
      "Interesante. ¿Podrías decirlo de otra manera?",
      "Me gustaría entender mejor. ¿Puedes explicar más?",
      "Estoy aprendiendo de esta interacción. ¿Podrías elaborar?",
      "¿Podrías dar más contexto para ayudarme a entender mejor?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  addManualKnowledge(input, response) {
    this.knowledge.set(input.toLowerCase(), response);
  }

  getAllKnowledge() {
    return Array.from(this.knowledge.entries()).map(([input, response]) => ({
      input,
      response
    }));
  }
}

const ai = new GenerativeAI();

// DOM Elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const messagesContainer = document.getElementById('messages');
const thinkingIndicator = document.querySelector('.learning-indicator');
const addKnowledgeBtn = document.getElementById('add-knowledge');
const viewKnowledgeBtn = document.getElementById('view-knowledge');
const knowledgeModal = document.getElementById('knowledge-modal');
const viewModal = document.getElementById('view-modal');
const closeButtons = document.querySelectorAll('.close');
const knowledgeForm = document.getElementById('knowledge-form');
const knowledgeList = document.getElementById('knowledge-list');

// Modal management
addKnowledgeBtn.addEventListener('click', () => {
  knowledgeModal.style.display = 'block';
});

viewKnowledgeBtn.addEventListener('click', () => {
  displayKnowledge();
  viewModal.style.display = 'block';
});

closeButtons.forEach(button => {
  button.addEventListener('click', () => {
    knowledgeModal.style.display = 'none';
    viewModal.style.display = 'none';
  });
});

window.addEventListener('click', (e) => {
  if (e.target === knowledgeModal) knowledgeModal.style.display = 'none';
  if (e.target === viewModal) viewModal.style.display = 'none';
});

// Knowledge form handling
knowledgeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('input-pattern').value;
  const response = document.getElementById('response-text').value;
  
  ai.addManualKnowledge(input, response);
  
  knowledgeForm.reset();
  knowledgeModal.style.display = 'none';
  
  addMessage('Conocimiento agregado: "' + input + '" → "' + response + '"', 'ai');
});

// Display knowledge function
function displayKnowledge() {
  const knowledge = ai.getAllKnowledge();
  knowledgeList.innerHTML = '';
  
  knowledge.forEach(item => {
    const div = document.createElement('div');
    div.className = 'knowledge-item';
    div.innerHTML = `
      <h3>Entrada: ${item.input}</h3>
      <p>Respuesta: ${item.response}</p>
    `;
    knowledgeList.appendChild(div);
  });
  
  if (knowledge.length === 0) {
    knowledgeList.innerHTML = '<p>No hay conocimiento almacenado aún.</p>';
  }
}

// Message and chat handling functions
function addMessage(text, type) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', `${type}-message`);
  messageDiv.textContent = text;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Show/hide thinking indicator
function setThinking(thinking) {
  thinkingIndicator.style.opacity = thinking ? '1' : '0.5';
  thinkingIndicator.querySelector('p').textContent = thinking ? 'Pensando...' : 'Aprendiendo...';
}

addMessage("¡Hola! Soy una IA generativa que aprende y evoluciona con cada conversación. ¿Sobre qué te gustaría conversar?", 'ai');

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const message = userInput.value.trim();
  if (!message) return;

  // Add user message
  addMessage(message, 'user');
  userInput.value = '';
  
  // Show thinking state
  setThinking(true);

  try {
    const response = await ai.generateResponse(message);
    setTimeout(() => {
      addMessage(response, 'ai');
      setThinking(false);
    }, 500); // Small delay for natural feel
  } catch (error) {
    console.error('Error:', error);
    setTimeout(() => {
      addMessage("Lo siento, tuve un problema generando una respuesta. ¿Podrías intentar de nuevo?", 'ai');
      setThinking(false);
    }, 500);
  }
});