const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over');
const startScreen = document.getElementById('start-screen');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Game constants
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Game state
let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let nextDx = 0; 
let nextDy = 0;
let score = 0;
let highScore = localStorage.getItem('neonSnakeHighScore') || 0;
let gameLoopTimeout;
let gameRunning = false;
let gameSpeed = 200; 
let lastRenderTime = 0;

// Colors matching CSS theme
const colors = {
    snake: '#10b981',
    snakeHead: '#34d399',
    food: '#ef4444',
    gridLines: 'rgba(255, 255, 255, 0.04)'
};

highScoreElement.textContent = highScore;

// Event Listeners
document.addEventListener('keydown', handleKeyPress);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    dx = 0;
    dy = -1;
    nextDx = 0;
    nextDy = -1;
    score = 0;
    gameSpeed = 200;
    scoreElement.textContent = score;
    placeFood();
}

function startGame() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    initGame();
    gameRunning = true;
    window.requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    if (!gameRunning) return;
    
    window.requestAnimationFrame(gameLoop);
    
    const secondsSinceLastRender = (currentTime - lastRenderTime);
    if (secondsSinceLastRender < gameSpeed) return;
    
    lastRenderTime = currentTime;

    // Apply the queued direction immediately before move
    dx = nextDx;
    dy = nextDy;
    
    if (hasGameEnded()) {
        endGame();
        return;
    }
    
    clearCanvas();
    drawGrid();
    drawFood();
    moveSnake();
    drawSnake();
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
    ctx.strokeStyle = colors.gridLines;
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const isHead = index === 0;
        
        ctx.shadowBlur = isHead ? 15 : 10;
        ctx.shadowColor = isHead ? colors.snakeHead : colors.snake;
        ctx.fillStyle = isHead ? colors.snakeHead : colors.snake;
        
        ctx.beginPath();
        // Inner padding for segment separation
        const margin = 1; 
        ctx.roundRect(
            segment.x * gridSize + margin, 
            segment.y * gridSize + margin, 
            gridSize - (margin * 2), 
            gridSize - (margin * 2), 
            isHead ? 6 : 4
        );
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Draw eyes
        if (isHead) {
            ctx.fillStyle = '#0f172a';
            const eyeSize = 2.5;
            const offset = 5;
            
            ctx.beginPath();
            if (dx === 1) { // Right
                ctx.arc(segment.x * gridSize + gridSize - offset, segment.y * gridSize + offset, eyeSize, 0, Math.PI * 2);
                ctx.arc(segment.x * gridSize + gridSize - offset, segment.y * gridSize + gridSize - offset, eyeSize, 0, Math.PI * 2);
            } else if (dx === -1) { // Left
                ctx.arc(segment.x * gridSize + offset, segment.y * gridSize + offset, eyeSize, 0, Math.PI * 2);
                ctx.arc(segment.x * gridSize + offset, segment.y * gridSize + gridSize - offset, eyeSize, 0, Math.PI * 2);
            } else if (dy === -1) { // Up
                ctx.arc(segment.x * gridSize + offset, segment.y * gridSize + offset, eyeSize, 0, Math.PI * 2);
                ctx.arc(segment.x * gridSize + gridSize - offset, segment.y * gridSize + offset, eyeSize, 0, Math.PI * 2);
            } else { // Down
                ctx.arc(segment.x * gridSize + offset, segment.y * gridSize + gridSize - offset, eyeSize, 0, Math.PI * 2);
                ctx.arc(segment.x * gridSize + gridSize - offset, segment.y * gridSize + gridSize - offset, eyeSize, 0, Math.PI * 2);
            }
            ctx.fill();
        }
    });
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        // Speed up the game gradually
        if (gameSpeed > 60) {
            gameSpeed -= 2;
        }
        
        placeFood();
        animateScore();
        
    } else {
        snake.pop();
    }
}

function animateScore() {
    scoreElement.style.transform = 'scale(1.4)';
    scoreElement.style.color = '#34d399';
    setTimeout(() => {
        scoreElement.style.transform = 'scale(1)';
        scoreElement.style.color = '#f1f5f9';
    }, 150);
}

function drawFood() {
    ctx.shadowBlur = 15;
    ctx.shadowColor = colors.food;
    ctx.fillStyle = colors.food;
    
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    const radius = gridSize / 2 - 3;
    
    // Pulsing effect based on time
    const pulse = 1 + Math.sin(Date.now() / 150) * 0.15;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a tiny highlight to make it look like a gem
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX - 2, centerY - 2, radius * 0.3 * pulse, 0, Math.PI * 2);
    ctx.fill();
}

function placeFood() {
    let validPosition = false;
    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        // Check if food spawns on snake
        validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

function hasGameEnded() {
    const head = snake[0];
    
    // Check walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }
    
    // Check self
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

function endGame() {
    gameRunning = false;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonSnakeHighScore', highScore);
        highScoreElement.textContent = highScore;
        
        finalScoreElement.innerHTML = `${score} <span style="color:#fde047;font-size:0.6em;display:block;margin-top:5px;font-weight:normal;">NEW HIGH SCORE! 🏆</span>`;
    } else {
        finalScoreElement.textContent = score;
    }
    
    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 400);
}

function handleKeyPress(e) {
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault(); // Prevent scrolling
    }
    
    if (e.key === ' ' && !gameRunning) {
        if (gameOverScreen.classList.contains('hidden') === false || startScreen.classList.contains('hidden') === false) {
            startGame();
            return;
        }
    }

    // Use a queued next direction to prevent rapid double-turns causing self collision
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;
    
    switch(e.key) {
        case 'ArrowLeft':
            if (!goingRight) { nextDx = -1; nextDy = 0; }
            break;
        case 'ArrowUp':
            if (!goingDown) { nextDx = 0; nextDy = -1; }
            break;
        case 'ArrowRight':
            if (!goingLeft) { nextDx = 1; nextDy = 0; }
            break;
        case 'ArrowDown':
            if (!goingUp) { nextDx = 0; nextDy = 1; }
            break;
    }
}

// Initial draw, showing the grid behind the start screen
clearCanvas();
drawGrid();
