// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCLDkSjW6k9uQQOtG5YBMVGUicu3U7iYOw",
    authDomain: "project-3239526019989473550.firebaseapp.com",
    projectId: "project-3239526019989473550",
    storageBucket: "project-3239526019989473550.firebasestorage.app",
    messagingSenderId: "189870003007",
    appId: "1:189870003007:web:bcf138aec814711134398a"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig)
const db = getFirestore(app);

let board = [];
let rows = 10;
let cols = 10;
let mines = 15;
let minesLeft = mines;
let username = "";
let startTime = 0;
let timerInterval;

const loginContainer = document.getElementById("login-container");
const gameContainer = document.getElementById("game-container");
const scoreboardContainer = document.getElementById("scoreboard-container");
const boardElement = document.getElementById("board");
const minesLeftElement = document.getElementById("mines-left");
const timerElement = document.getElementById("timer");
const scoreboardTable = document.getElementById("scoreboard").getElementsByTagName('tbody')[0];
const restartButton = document.getElementById("restart-button");

document.getElementById("login-button").addEventListener("click", () => {
    username = document.getElementById("username").value;
    if (username) {
        loginContainer.style.display = "none";
        gameContainer.style.display = "block";
        startGame();
    }
});

restartButton.addEventListener("click", () => {
    scoreboardContainer.style.display = "none";
    gameContainer.style.display = "block";
    startGame();
});

function startGame() {
    board = createBoard(rows, cols, mines);
    renderBoard();
    minesLeft = mines;
    minesLeftElement.textContent = minesLeft;
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function createBoard(rows, cols, mines) {
    const board = Array(rows).fill(null).map(() => Array(cols).fill(0));
    let minesPlaced = 0;
    while (minesPlaced < mines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        if (board[row][col] === 0) {
            board[row][col] = "mine";
            minesPlaced++;
        }
    }
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (board[i][j] !== "mine") {
                board[i][j] = countAdjacentMines(board, i, j);
            }
        }
    }
    return board;
}

function countAdjacentMines(board, row, col) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue;
            const newRow = row + i;
            const newCol = col + j;
            if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board[0].length && board[newRow][newCol] === "mine") {
                count++;
            }
        }
    }
    return count;
}

function renderBoard() {
    boardElement.innerHTML = "";
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const cell = document.createElement("div");
            cell.classList.add("board-cell");
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener("click", handleCellClick);
            cell.addEventListener("contextmenu", handleCellRightClick);
            boardElement.appendChild(cell);
        }
    }
}

function handleCellClick(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    revealCell(row, col);
}

function handleCellRightClick(event) {
    event.preventDefault();
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    toggleFlag(row, col);
}

function revealCell(row, col) {
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    const cell = boardElement.children[row * cols + col];
    if (cell.classList.contains("revealed")) return;
    cell.classList.add("revealed");
    if (board[row][col] === "mine") {
        cell.classList.add("mine");
        gameOver();
    } else if (board[row][col] === 0) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                revealCell(row + i, col + j);
            }
        }
    } else {
        cell.textContent = board[row][col];
    }
    checkWin();
}

function toggleFlag(row, col) {
    const cell = boardElement.children[row * cols + col];
    if (cell.classList.contains("revealed")) return;
    if (cell.textContent === "") {
        cell.textContent = "";
        minesLeft++;
    } else {
        cell.textContent = "";
        minesLeft--;
    }
    minesLeftElement.textContent = minesLeft;
}

function checkWin() {
    let revealedCount = 0;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (boardElement.children[i * cols + j].classList.contains("revealed")) {
                revealedCount++;
            }
        }
    }
    if (revealedCount === rows * cols - mines) {
        gameWon();
    }
}

function gameOver() {
    clearInterval(timerInterval);
    alert("¡Perdiste!");
    showScoreboard();
}

function gameWon() {
    clearInterval(timerInterval);
    alert("¡Ganaste!");
    showScoreboard();
}

function updateTimer() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    timerElement.textContent = elapsedTime;
}

async function showScoreboard() {
    gameContainer.style.display = "none";
    scoreboardContainer.style.display = "block";
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    await saveScore(username, elapsedTime);
    await loadScores();
}

async function saveScore(username, time) {
    try {
        await addDoc(collection(db, "scores"), {
            username: username,
            time: time
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function loadScores() {
    scoreboardTable.innerHTML = "";
    const q = query(collection(db, "scores"), orderBy("time"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const row = scoreboardTable.insertRow();
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        cell1.textContent = data.username;
        cell2.textContent = data.time;
    });
}