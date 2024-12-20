// script.js

/***************************************
 * CONFIGURATION PARAMETERS
 ***************************************/

// Colors
const CONFIG = {
    textColor: '#87170E',            // Dark red for characters/words
    fadeColor: 'rgba(0, 0, 0, 0.09)',
    logoColor: '#FF0000',
    backgroundColor: 'black',
};

// Animation Speed and Frequency
const ANIMATION = {
    fontSize: 13,
    drawInterval: 70,
    wordProbability: 0.0002,
    hangDuration: 20,
    initialFillThreshold: 1.0,
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%',
};

// Special Word
const SPECIAL_WORD = {
    text: "MARKET CRASH",
};

// Extract characters from the ANIMATION configuration
const characters = ANIMATION.characters;

// Get the canvas element and its context
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');

// Set the font for the canvas
ctx.font = `${ANIMATION.fontSize}px monospace`;

// Initialize variables
let columns;            
let drops;              
let dropStates;         
let activeWords;        
let columnsFilledOnce;  
let initialFillComplete = false;

// Variables for the first-run text
let firstRun = true;
const firstRunText = "Click THE CRYPTO CRISIS to play our nodes game. ";
const firstRunDuration = 5000; // Duration in milliseconds to display the text
let firstRunEndTime = null;

/**
 * Function to resize the canvas and recalculate columns.
 * Also resets drops and states.
 */
function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;

    // Set the canvas size based on the window size and pixel ratio
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;

    // Set the CSS display size
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Reset any existing transforms before scaling
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Scale the drawing context to account for the pixel ratio
    ctx.scale(ratio, ratio);

    // Set the font for the canvas with the custom font
    ctx.font = `${ANIMATION.fontSize}px 'SquareSansSerif7'`;

    // Recalculate columns based on new width
    columns = Math.floor(window.innerWidth / ANIMATION.fontSize);
    drops = Array(columns).fill(1);
    dropStates = Array(columns).fill(null);
    activeWords = [];
    columnsFilledOnce = Array(columns).fill(false);
    initialFillComplete = false;
}

// Initial canvas size setup
resizeCanvas();

/**
 * Function to handle the special word drop ("PAPERCLIPS").
 * @param {number} i - The current column index.
 */
function handleWordDrop(i) {
    const letterIndex = dropStates[i].currentLetter;
    const x = i * ANIMATION.fontSize;
    const y = drops[i] * ANIMATION.fontSize;

    if (letterIndex < SPECIAL_WORD.text.length) {
        const text = SPECIAL_WORD.text.charAt(letterIndex);
        ctx.fillText(text, x, y);
        dropStates[i].currentLetter++;
        drops[i]++;
    } else if (!dropStates[i].hasHung) {
        // Word fully drawn; initiate hang
        dropStates[i].hasHung = true;
        dropStates[i].hangFrames = ANIMATION.hangDuration;

        activeWords.push({
            x: i * ANIMATION.fontSize,
            y: drops[i] * ANIMATION.fontSize - SPECIAL_WORD.text.length * ANIMATION.fontSize,
            letters: SPECIAL_WORD.text,
            hangFrames: ANIMATION.hangDuration
        });
    } else {
        // Word in hang phase
        if (dropStates[i].hangFrames > 0) {
            dropStates[i].hangFrames--;
        } else {
            // Hang phase over; reset drop
            dropStates[i] = null;
            if (drops[i] > canvas.height / ANIMATION.fontSize * ANIMATION.initialFillThreshold) {
                drops[i] = 0;
            }
        }
    }
}

/**
 * Function to handle normal random character drops.
 * @param {number} i - The current column index.
 */
function handleRandomDrop(i) {
    const text = characters.charAt(Math.floor(Math.random() * characters.length));
    const x = i * ANIMATION.fontSize;
    const y = drops[i] * ANIMATION.fontSize;
    ctx.fillText(text, x, y);

    if (y >= canvas.height / ANIMATION.fontSize * ANIMATION.initialFillThreshold) {
        columnsFilledOnce[i] = true;
    }

    if (!initialFillComplete) {
        initialFillComplete = columnsFilledOnce.every(filled => filled);
    }

    if (initialFillComplete) {
        if (Math.random() < ANIMATION.wordProbability && i <= columns - SPECIAL_WORD.text.length) {
            dropStates[i] = {
                isWord: true,
                currentLetter: 0,
                hasHung: false,
                hangFrames: ANIMATION.hangDuration
            };
        }
    }

    if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
        dropStates[i] = null;
    }

    drops[i]++;
}

/**
 * Function to draw active words that are in the hang phase.
 */
function drawActiveWords() {
    activeWords.forEach((wordObj, index) => {
        const { x, y, letters } = wordObj;
        if (wordObj.hangFrames > 0) {
            ctx.fillStyle = CONFIG.textColor;
            for (let j = 0; j < letters.length; j++) {
                ctx.fillText(letters.charAt(j), x, y + j * ANIMATION.fontSize);
            }
            wordObj.hangFrames--;
        } else {
            activeWords.splice(index, 1);
        }
    });
}

/**
 * Main draw function for the animation loop.
 */
function draw() {
    // Fade the background slightly to create the trail effect
    ctx.fillStyle = CONFIG.fadeColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Display first-run text
    if (firstRun) {
        if (!firstRunEndTime) {
            firstRunEndTime = Date.now() + firstRunDuration;
        }

        if (Date.now() < firstRunEndTime) {
            ctx.fillStyle = "#00FF00";
            ctx.font = `${ANIMATION.fontSize}px monospace`;
            const textX = (window.innerWidth - firstRunText.length * ANIMATION.fontSize) / 2;
            const textY = window.innerHeight * 0.2;

            for (let i = 0; i < firstRunText.length; i++) {
                ctx.fillText(firstRunText[i], textX + i * ANIMATION.fontSize, textY);
            }

            return;
        } else {
            firstRun = false;
        }
    }

    // Set the text color and font for the normal matrix rain
    ctx.fillStyle = CONFIG.textColor;
    ctx.font = `${ANIMATION.fontSize}px monospace`;

    for (let i = 0; i < columns; i++) {
        if (dropStates[i] && dropStates[i].isWord) {
            handleWordDrop(i);
        } else {
            handleRandomDrop(i);
        }
    }

    // Draw active words that are in the hang phase
    drawActiveWords();
}

// Start the animation loop
const interval = setInterval(draw, ANIMATION.drawInterval);
window.addEventListener('resize', resizeCanvas);

/***************************************
 * POP-UP FUNCTIONALITY
 ***************************************/

const containerElement = document.getElementById('container');
const originalContent = containerElement.innerHTML;

/**
 * Function to open a pop-up
 * @param {string} contentUrl - The URL of the content to load into the pop-up
 */
function openPopup(contentUrl) {
    containerElement.classList.add('popup');
    containerElement.innerHTML = '';

    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.classList.add('close-btn');
    closeBtn.onclick = closePopup;
    containerElement.appendChild(closeBtn);

    const contentWrapper = document.createElement('div');
    contentWrapper.classList.add('content-wrapper');
    containerElement.appendChild(contentWrapper);

    // Append version parameter here
    const version = '1.0.2'; // Increment as needed for updates
    const fetchUrl = `${contentUrl}?v=${version}`;

    fetch(fetchUrl)
        .then(response => {
            if (!response.ok) { throw new Error('Network response was not ok'); }
            return response.text();
        })
        .then(data => {
            contentWrapper.innerHTML = data;
            containerElement.classList.add('popup-loaded');
        })
        .catch(error => {
            contentWrapper.innerHTML = `<p class="plain">Failed to load content.</p>`;
            console.error('Fetch error:', error);
        });
}

/**
 * Function to close the pop-up and restore original content
 */
function closePopup() {
    containerElement.classList.remove('popup');
    containerElement.innerHTML = originalContent;

    attachLinkEventListeners();

    const logo = document.getElementById('logo');
    logo.addEventListener('mouseenter', triggerGlitch);
    logo.addEventListener('touchstart', triggerGlitch);
    logo.addEventListener('click', showDashboard);
}

/**
 * Function to attach event listeners to TEAM link
 */
function attachLinkEventListeners() {
    const teamLink = document.getElementById('team-link');
    if (teamLink) {
        teamLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Fetch team.html with version parameter handled inside openPopup
            openPopup('team.html');
        });
    }
}

/***************************************
 * GLITCH EFFECT
 ***************************************/

/**
 * Function to trigger the glitch effect
 */
function triggerGlitch() {
    const logo = document.getElementById('logo');
    logo.setAttribute('data-text', logo.textContent);
    logo.classList.add('glitch-effect');
    setTimeout(() => {
        logo.classList.remove('glitch-effect');
    }, 300);
}

/**
 * Function to schedule the next glitch at a random interval between 10-20 seconds
 */
function scheduleGlitch() {
    const randomTime = Math.floor(Math.random() * (20000 - 10000 + 1)) + 10000;
    setTimeout(() => {
        triggerGlitch();
        scheduleGlitch();
    }, randomTime);
}

/***************************************
 * DASHBOARD FUNCTIONALITY
 ***************************************/

/**
 * Function to show the game selection dashboard
 */
function showDashboard() {
    const container = document.getElementById('container');
    container.innerHTML = '';

    const dashboardWrapper = document.createElement('div');
    dashboardWrapper.classList.add('dashboard');

    const dashboardTitle = document.createElement('div');
    dashboardTitle.classList.add('dashboard-title');
    dashboardTitle.textContent = 'GAMES DASHBOARD';
    dashboardWrapper.appendChild(dashboardTitle);

    const dashboardInstruction = document.createElement('div');
    dashboardInstruction.classList.add('dashboard-instruction');
    dashboardInstruction.textContent = 'Select a game below:';
    dashboardWrapper.appendChild(dashboardInstruction);

    const gamesList = document.createElement('div');
    gamesList.classList.add('games-list');

    const gameItem = document.createElement('div');
    gameItem.classList.add('game-item');

    const gameTitle = document.createElement('span');
    gameTitle.textContent = 'Node Miner';
    gameItem.appendChild(gameTitle);

    const startGameBtn = document.createElement('button');
    startGameBtn.classList.add('game-btn');
    startGameBtn.textContent = 'Play';
    startGameBtn.addEventListener('click', startGame);
    gameItem.appendChild(startGameBtn);

    gamesList.appendChild(gameItem);
    dashboardWrapper.appendChild(gamesList);

    const backButton = document.createElement('button');
    backButton.classList.add('dashboard-back-btn');
    backButton.textContent = 'Back to Crypto Crisis';
    backButton.addEventListener('click', closeDashboard);
    dashboardWrapper.appendChild(backButton);

    container.appendChild(dashboardWrapper);
}

/**
 * Function to close the dashboard and return to the original PAPERCLIP FACTORY view
 */
function closeDashboard() {
    containerElement.classList.remove('popup');
    containerElement.innerHTML = originalContent;

    attachLinkEventListeners();

    const logo = document.getElementById('logo');
    logo.addEventListener('mouseenter', triggerGlitch);
    logo.addEventListener('touchstart', triggerGlitch);
    logo.addEventListener('click', showDashboard);
}

/***************************************
 * GAME LOGIC
 ***************************************/

let gameInterval;
let gameSpeed = 200;
let playerPosition = Math.floor(30 / 2);
const gameWidth = 30;
let paperclips = [];
let score = 0;

/**
 * Function to initialize the game
 */
function initGame() {
    playerPosition = Math.floor(gameWidth / 2);
    paperclips = [];
    score = 0;

    gameInterval = setInterval(gameLoop, gameSpeed);
    document.addEventListener('keydown', handleKeyDown);
}

/**
 * Function to handle user input for moving the player
 * @param {KeyboardEvent} event 
 */
function handleKeyDown(event) {
    if (event.key === 'ArrowLeft' && playerPosition > 0) {
        playerPosition--;
    } else if (event.key === 'ArrowRight' && playerPosition < gameWidth - 1) {
        playerPosition++;
    }
}

/**
 * Main game loop
 */
function gameLoop() {
    // Randomly add a new paperclip
    if (Math.random() < 0.3) {
        paperclips.push({ x: Math.floor(Math.random() * gameWidth), y: 0 });
    }

    // Move paperclips down
    for (let i = 0; i < paperclips.length; i++) {
        paperclips[i].y++;

        // Check for collision with the player
        if (paperclips[i].y === 5 && paperclips[i].x === playerPosition) {
            score++;
            // Remove the paperclip
            paperclips.splice(i, 1);
            i--;
        } else if (paperclips[i].y > 5) {
            // Remove paperclips that have fallen past the player
            paperclips.splice(i, 1);
            i--;
        }
    }

    // Render the game
    renderGame();
}

/**
 * Function to render the game state
 */
function renderGame() {
    const container = document.getElementById('container');
    let output = '';

    // Add the [X] button at the top-right without leading spaces or newlines
    output += `<div class="game-header"><span class="close-game-btn" id="closeGameBtn">&times;</span></div><pre>`;

    // Top border
    output += '+';
    for (let i = 0; i < gameWidth; i++) {
        output += '-';
    }
    output += '+\n';

    // Game area (rows 0 to 5)
    for (let y = 0; y < 6; y++) { // 6 rows
        output += '|';
        for (let x = 0; x < gameWidth; x++) {
            let isPaperclip = false;
            for (const clip of paperclips) {
                if (clip.x === x && clip.y === y) {
                    output += '|'; // Paperclip symbol
                    isPaperclip = true;
                    break;
                }
            }
            if (!isPaperclip) output += ' ';
        }
        output += '|\n';
    }

    // Player row (row 6)
    output += '|';
    for (let x = 0; x < gameWidth; x++) {
        if (x === playerPosition) {
            output += 'U'; // Player represented by 'U'
        } else {
            output += ' ';
        }
    }
    output += '|\n';

    // Bottom border
    output += '+';
    for (let i = 0; i < gameWidth; i++) {
        output += '-';
    }
    output += '+\n';
    output += '</pre>';

    // Add the score display at the bottom-center without leading spaces or newlines
    output += `<div class="game-footer">Nodes Mined: ${score}</div>`;

    // Update the container's HTML
    container.innerHTML = output;

    // Attach event listener to the [X] button
    const closeBtn = document.getElementById('closeGameBtn');
    closeBtn.addEventListener('click', exitGame);
}

/**
 * Function to detect if the user is on a mobile device.
 * @returns {boolean}
 */
function isMobileDevice() {
    return window.matchMedia("(max-width: 768px)").matches; 
}

/**
 * Function to start the game
 */
function startGame() {
    if (isMobileDevice()) {
        alert("The game is not available on mobile devices. Please use a desktop browser.");
        return; // Prevent the game from starting
    }

    const container = document.getElementById('container');
    container.innerHTML = '';
    initGame();
}

/**
 * Function to exit the game and return to the dashboard
 */
function exitGame() {
    // Clear the game interval to stop the game loop
    clearInterval(gameInterval);

    // Remove the keydown event listener
    document.removeEventListener('keydown', handleKeyDown);

    // Return to the dashboard
    showDashboard();
}

/***************************************
 * GLOBAL PAPERCLIPS COUNTER
 ***************************************/
let globalPaperclips = 0;
const globalCounterValue = document.getElementById('globalCounterValue');

/**
 * Function to update the displayed global paperclips count.
 */
function updateGlobalCounter() {
    if (globalCounterValue) {
        globalCounterValue.textContent = globalPaperclips;
    }
}

/**
 * Function that increments the global counter and schedules the next increment 
 * at a random rate between 10 and 50 increments per second.
 */
function incrementGlobalCounter() {
    // Increment the global paperclips counter by 1
    globalPaperclips++;
    updateGlobalCounter();

    // Choose a random increments-per-second value between 10 and 50
    const incrementsPerSecond = Math.floor(Math.random() * (100 - 2 + 1)) + 10; // 10 to 50

    // Convert increments-per-second into a delay for each increment
    const incrementInterval = 10000 / incrementsPerSecond; // milliseconds

    // Schedule the next increment after the calculated delay
    setTimeout(incrementGlobalCounter, incrementInterval);
}

/**
 * Start the global counter increments.
 */
function startGlobalCounter() {
    incrementGlobalCounter();
}

/***************************************
 * BACKGROUND MUSIC CONTROLLER
 ***************************************/

// Get references to the audio and button elements
const bgMusic = document.getElementById('bgMusic');
const volumeBtn = document.getElementById('volumeBtn');
const volumeIcon = document.getElementById('volumeIcon');

/**
 * Function to toggle music play/pause
 */
function toggleMusic() {
    if (bgMusic.paused) {
        bgMusic.play().then(() => {
            volumeIcon.src = 'assets/volume-on.png?v=1.0.2';
            volumeIcon.alt = 'Volume On';
        }).catch(error => {
            console.error('Error playing background music:', error);
        });
    } else {
        bgMusic.pause();
        volumeIcon.src = 'assets/volume-off.png?v=1.0.2';
        volumeIcon.alt = 'Volume Off';
    }
}

// Event listener for the volume button
volumeBtn.addEventListener('click', toggleMusic);

/***************************************
 * INITIALIZATION
 ***************************************/

/**
 * Window onload event to initialize functionalities
 */
window.onload = () => {
    // Wait for all fonts to be loaded
    document.fonts.ready.then(() => {
        resizeCanvas(); // Ensure canvas is correctly sized
        scheduleGlitch(); // Start glitch scheduling
        startGlobalCounter(); // Start the global counter

        const containerElement = document.getElementById('container');
        const logo = document.getElementById('logo');

        // Attach glitch effects
        logo.addEventListener('mouseenter', triggerGlitch);
        logo.addEventListener('touchstart', triggerGlitch);

        // Instead of starting the game, show dashboard when logo clicked
        logo.addEventListener('click', showDashboard);

        // Attach pop-up event listeners
        attachLinkEventListeners();
    }).catch((error) => {
        console.error('Error loading fonts:', error);
    });
};