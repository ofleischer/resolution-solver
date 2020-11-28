const fs = require("fs")
const solver = require("./solver.js")

const filename = process.argv[2] || "input.txt"
const input = fs.readFileSync(filename).toString().split("\n")
const header = input[0]
const clauses = solver(input)

if (clauses) {
    const padLength = Math.max(...clauses.map(c => c.clause.length)) + 2
    for (const c of clauses) {
        const { clause, index, resolution } = c
        console.log(clause.padEnd(padLength) + index.padStart(4) + (resolution || ""))
    }
} else {
    console.log("Not resolvable")
}

