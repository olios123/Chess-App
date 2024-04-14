const anim = document.getElementById("anim")

const c = ["Black", "White"]
const p = ["Pawn", "Bishop", "Rook", "Knight", "King", "Queen"]

const animImg = document.createElement("img")

animImg.src = "/public/assets/pieces/png/" +
    c[Math.floor(Math.random() * c.length)] + "-" +
    p[Math.floor(Math.random() * p.length)] + ".png"

anim.appendChild(animImg)
