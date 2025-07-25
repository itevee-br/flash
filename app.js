console.log('Supabase carregado?', typeof supabase);

async function initializeApplication() {
  try {
    const supabaseUrl = 'https://ectzevuwedhdjbbzphos.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdHpldnV3ZWRoZGpiYnpwaG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MDU5MzAsImV4cCI6MjA2ODE4MTkzMH0.b_85saKTZC85UDXDYC5xVZL7tKhNOTEVedBP5S0POHw';
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .limit(1);

    if (error) throw error;

    console.log('Conexão com Supabase estabelecida com sucesso!');
    setupEventListeners(supabase);
  } catch (error) {
    console.error('Erro durante a inicialização:', error);
    showErrorToUser('Erro ao conectar com o banco de dados.');
  }
}

function setupEventListeners(supabase) {
  const addBtn = document.getElementById('addBtn');
  const randomBtn = document.getElementById('randomBtn');
  const themeBtn = document.getElementById('themeBtn');
  const addForm = document.getElementById('addForm');
  const themeForm = document.getElementById('themeForm');
  const flashcardForm = document.getElementById('flashcardForm');
  const flashcardView = document.getElementById('flashcardView');
  const cardContent = document.getElementById('cardContent');
  const showAnswer = document.getElementById('showAnswer');
  const showExplanation = document.getElementById('showExplanation');
  const nextCard = document.getElementById('nextCard');
  const cancelAdd = document.getElementById('cancelAdd');
  const temaSelect = document.getElementById('temaSelect');
  const loadTheme = document.getElementById('loadTheme');
  const cancelTheme = document.getElementById('cancelTheme');
  const btnAcertou = document.getElementById('btnAcertou');
  const btnErrou = document.getElementById('btnErrou');
  const answerButtons = document.getElementById('answerButtons');
  const importBtn = document.getElementById('importBtn');
  const jsonInput = document.getElementById('jsonInput');

  importBtn.addEventListener('click', () => jsonInput.click());
  jsonInput.addEventListener('change', (e) => handleJSONImport(e, supabase));


  window.appState = {
    currentCards: [],
    currentCardIndex: 0,
    currentView: 'question',
  };

  addBtn.addEventListener('click', () => showAddForm(addForm));
  randomBtn.addEventListener('click', () => loadRandomCard(supabase, window.appState, flashcardView, cardContent, showAnswer, showExplanation, nextCard));
  themeBtn.addEventListener('click', () => showThemeForm(themeForm, supabase, temaSelect));
  loadTheme.addEventListener('click', () => loadThemeCards(supabase, temaSelect, window.appState, flashcardView, cardContent, showAnswer, showExplanation, nextCard));
  cancelAdd.addEventListener('click', () => hideAllForms());
  cancelTheme.addEventListener('click', () => hideAllForms());

  flashcardForm.addEventListener('submit', (e) => saveFlashcard(e, supabase, flashcardForm, addForm));
  showAnswer.addEventListener('click', () => showCardView('answer', window.appState, cardContent, showAnswer, showExplanation, nextCard));
  showExplanation.addEventListener('click', () => showCardView('explanation', window.appState, cardContent, showAnswer, showExplanation, nextCard));
  nextCard.addEventListener('click', () => showNextCard(window.appState, cardContent, showAnswer, showExplanation, nextCard));

  btnAcertou.addEventListener('click', () => updateScore(supabase, +1));
  btnErrou.addEventListener('click', () => updateScore(supabase, -1));
}

function showErrorToUser(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff4444;
    color: white;
    padding: 15px;
    border-radius: 5px;
    z-index: 1000;
  `;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

function showAddForm(addForm) {
  hideAllForms();
  addForm.classList.remove('hidden');
}

function hideAllForms() {
  document.querySelectorAll('.form-container, #flashcardView').forEach(el => {
    el.classList.add('hidden');
  });
}

async function saveFlashcard(e, supabase, form, addForm) {
  e.preventDefault();
  try {
    const tema = document.getElementById('tema').value;
    const pergunta = document.getElementById('pergunta').value;
    const resposta = document.getElementById('resposta').value;
    const explicacao = document.getElementById('explicacao').value;

    const { error } = await supabase
      .from('flashcards')
      .insert([{ tema, pergunta, resposta, explicacao }]);

    if (error) throw error;

    alert('Flashcard salvo com sucesso!');
    form.reset();
    hideAllForms();
  } catch (error) {
    console.error('Erro ao salvar flashcard:', error);
    showErrorToUser('Erro ao salvar flashcard');
  }
}

async function loadRandomCard(supabase, appState, flashcardView, cardContent, showAnswer, showExplanation, nextCard) {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*');

    if (error) throw error;
    if (data.length === 0) return alert('Nenhum flashcard encontrado.');

    appState.currentCards = shuffleArray(data);
    appState.currentCardIndex = 0;
    showFlashcardView(appState, flashcardView, cardContent, showAnswer, showExplanation, nextCard);
  } catch (error) {
    console.error('Erro ao carregar flashcards aleatórios:', error);
    showErrorToUser('Erro ao carregar flashcards');
  }
}

function showFlashcardView(appState, flashcardView, cardContent, showAnswer, showExplanation, nextCard) {
  hideAllForms();
  flashcardView.classList.remove('hidden');
  appState.currentView = 'question';
  updateCardView(appState, cardContent, showAnswer, showExplanation, nextCard);
}

function updateCardView(appState, cardContent, showAnswer, showExplanation, nextCard) {
  const card = appState.currentCards[appState.currentCardIndex];
  const btnAcertou = document.getElementById('btnAcertou');
  const btnErrou = document.getElementById('btnErrou');
  const answerButtons = document.getElementById('answerButtons');

  showAnswer.classList.remove('hidden');
  showExplanation.classList.add('hidden');
  nextCard.classList.add('hidden');
  answerButtons.classList.add('hidden');

  switch (appState.currentView) {
    case 'question':
      cardContent.innerHTML = `<h3>${card.tema}</h3><p><strong>Pergunta:</strong> ${card.pergunta}</p>`;
      break;

    case 'answer':
      cardContent.innerHTML = `
        <h3>${card.tema}</h3>
        <p><strong>Pergunta:</strong> ${card.pergunta}</p>
        <p><strong>Resposta:</strong> ${card.resposta}</p>
        <p><strong>Acertos:</strong> ${card.acertos || 0}</p>
      `;
      showAnswer.classList.add('hidden');
      answerButtons.classList.remove('hidden');
      break;

    case 'explanation':
      cardContent.innerHTML = `
        <h3>${card.tema}</h3>
        <p><strong>Pergunta:</strong> ${card.pergunta}</p>
        <p><strong>Resposta:</strong> ${card.resposta}</p>
        <p><strong>Explicação:</strong> ${card.explicacao}</p>
        <p><strong>Acertos:</strong> ${card.acertos || 0}</p>
      `;
      showExplanation.classList.add('hidden');
      nextCard.classList.remove('hidden');
      break;
  }
}

function showCardView(view, appState, cardContent, showAnswer, showExplanation, nextCard) {
  appState.currentView = view;
  updateCardView(appState, cardContent, showAnswer, showExplanation, nextCard);
}

function showNextCard(appState, cardContent, showAnswer, showExplanation, nextCard) {
  if (!appState.currentCards || appState.currentCards.length === 0) {
    showErrorToUser("Nenhum flashcard carregado.");
    return;
  }

  const randomIndex = Math.floor(Math.random() * appState.currentCards.length);
  appState.currentCardIndex = randomIndex;
  appState.currentView = 'question';
  updateCardView(appState, cardContent, showAnswer, showExplanation, nextCard);
}

function showThemeForm(themeForm, supabase, temaSelect) {
  hideAllForms();
  themeForm.classList.remove('hidden');
  loadThemes(supabase, temaSelect);
}

async function loadThemes(supabase, selectElement) {
  try {
    const { data, error } = await supabase
      .from('flashcards')
      .select('tema')
      .not('tema', 'is', null)
      .order('tema', { ascending: true });

    if (error) throw error;

    const uniqueThemes = [...new Set(data.map(item => item.tema))];
    selectElement.innerHTML = '';
    uniqueThemes.forEach(tema => {
      const option = document.createElement('option');
      option.value = tema;
      option.textContent = tema;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao carregar temas:', error);
    showErrorToUser('Erro ao carregar temas');
  }
}

async function loadThemeCards(supabase, selectElement, appState, flashcardView, cardContent, showAnswer, showExplanation, nextCard) {
  try {
    const tema = selectElement.value;

    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('tema', tema);

    if (error) throw error;
    if (data.length === 0) return alert('Nenhum flashcard encontrado para este tema.');

    appState.currentCards = shuffleArray(data);
    appState.currentCardIndex = 0;
    showFlashcardView(appState, flashcardView, cardContent, showAnswer, showExplanation, nextCard);
  } catch (error) {
    console.error('Erro ao carregar flashcards por tema:', error);
    showErrorToUser('Erro ao carregar flashcards por tema');
  }
}

function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function updateScore(supabase, delta) {
  const appState = window.appState;
  const card = appState.currentCards[appState.currentCardIndex];

  if (!card || !card.id) {
    showErrorToUser("Erro ao identificar o flashcard.");
    return;
  }

  supabase
    .from('flashcards')
    .update({ acertos: (card.acertos || 0) + delta })
    .eq('id', card.id)
    .select('acertos')
    .then(({ data, error }) => {
      if (error) {
        console.error('Erro ao atualizar acertos:', error);
        showErrorToUser('Erro ao registrar sua resposta.');
      } else {
        card.acertos = data[0].acertos;
        if (card.explicacao) {
          appState.currentView = 'explanation';
          updateCardView(appState, document.getElementById('cardContent'), document.getElementById('showAnswer'), document.getElementById('showExplanation'), document.getElementById('nextCard'));
        } else {
          showNextCard(appState, document.getElementById('cardContent'), document.getElementById('showAnswer'), document.getElementById('showExplanation'), document.getElementById('nextCard'));
        }
      }
    });
}

function handleJSONImport(event, supabase) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const json = JSON.parse(e.target.result);

      if (!json.tema || !Array.isArray(json.perguntas)) {
        return showErrorToUser("JSON inválido. Deve conter 'tema' e uma lista de 'perguntas'.");
      }

      const registros = json.perguntas.map((item) => {
        if (!item.pergunta || !item.resposta) {
          throw new Error("Cada pergunta precisa conter pelo menos 'pergunta' e 'resposta'.");
        }
        return {
          tema: json.tema,
          pergunta: item.pergunta,
          resposta: item.resposta,
          explicacao: item.explicacao || '',
          acertos: 0
        };
      });

      const { error } = await supabase.from('flashcards').insert(registros);

      if (error) {
        console.error("Erro ao importar flashcards:", error);
        return showErrorToUser("Erro ao importar perguntas.");
      }

      alert("Perguntas importadas com sucesso!");
      jsonInput.value = ""; // reseta o input

    } catch (err) {
      console.error("Erro ao processar JSON:", err);
      showErrorToUser("Erro ao ler o arquivo JSON.");
    }
  };

  reader.readAsText(file);
}


document.addEventListener('DOMContentLoaded', initializeApplication);