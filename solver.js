if (typeof module !== "undefined") {
    module.exports = main
} else {
    window.main = main
}

function main(inputArray, NEEDLE = {}) {
    inputArray = inputArray.map(line => line.split("#")[0].trim()).filter(Boolean)
    const [header, ...cnf] = inputArray
    const vars = header.split(" ").filter(Boolean)
    const nvars = vars.map(v => `-${v}`)

    const TAG = Symbol("TAG")
    const RES = Symbol("RES")
    let _idx = 0
    const START_CLAUSES = cnf.filter(Boolean).map(parseLine)

    // auxiliary functions

    function resolve() {
        let clauses = [...START_CLAUSES]

        while (true) {
            const l = clauses.length

            const ps = pairs(clauses)
            const newClauses = ps.map(combine)
                .reduce((a,b) => [...a,...b], [])
            clauses.push(...newClauses)
            for (let idx = clauses.length -1; idx >= START_CLAUSES.length; idx--) {
                const c = clauses[idx]
                if (clauses.slice(0, idx - 1).some(c2 => equals(c, c2))) {
                    clauses.splice(idx, 1)
                }
            }

            const match = clauses.find(c => equals(c, NEEDLE))
            if (match) {
                return [clauses, match]
            } else if (clauses.length === l) {
                return [clauses]
            }
        }
    }

    function parseLine(line, i) {
        _idx++
        return line.split(" ").reduce((acc, s) => {
            return {
                ...acc,
                [s.slice(-1)]: s[0] !== "-",
                [`-${s.slice(-1)}`]: s[0] === "-",
                [TAG]: _idx,
            }
        }, {})
    }

    // function toS(c) {
    //    return [
    //        ...vars.filter(v => c[v] === true),
    //        ...vars.map(v => `-${v}`).filter(v => c[v] === true),
    //        "\t",
    //        `R${c[TAG]}`,
    //        c[RES] && `(${c[RES].left},${c[RES].right},${c[RES].var})`,
    //    ].filter(Boolean).join(" ")
    // }

    function toObj(c) {
        vars.reduce((a,v,i) => [...a, v, nvars[i]], [])
        const clause = [
            ...vars.reduce((a,v,i) => [...a, v, nvars[i]], []).filter(v => c[v] === true),
        ].join(" ")
        const index = `R${c[TAG]}`
        const resolution = c[RES] ? `(${c[RES].left},${c[RES].right},${c[RES].var})` : undefined
        return { clause, index, resolution }
    }

    function pairs(cs) {
        return cs.reduce((acc,c,i,arr) => {
            if (i + 1 === arr.length) {
                return acc
            } else {
                return [
                    ...acc,
                    ...arr.slice(i+1).map(c2 => [c, c2])
                ]
            }
        }, [])
    }

    function combine([c1, c2]) {
        return vars.map(v => {
            let c3 = null
            if (c2[v] === true && c1[`-${v}`] === true) {
                [c1, c2] = [c2, c1]
            }
            if (c1[v] === true && c2[`-${v}`] === true) {
                const { [v]: _1, ...c1_ } = c1
                const { [`-${v}`]: _2, ...c2_ } = c2
                c3 = { }
                for (const v of [...vars, ...nvars]) {
                    if (c1_[v] === true) (c3[v] = true)
                    if (c2_[v] === true) (c3[v] = true)
                }
            }
            if (c3) {
                c3[TAG] = ++_idx
                c3[RES] = { left: c1[TAG], right: c2[TAG], var: v }
            }
            return c3
        }).filter(Boolean)
    }

    function equals(c1, c2) {
        return [...vars, ...nvars].every(v => !!c1[v] == !!c2[v])
    }

    function toMap(cs) {
        return cs.reduce((acc, c) => {
            return {
                ...acc,
                [c[TAG]]: c,
            }
        }, {})
    }

    // main routine

    const [clauses, match] = resolve(cnf)

    if (match) {
        const map = toMap(clauses)
        
        const neededClausesSet = new Set(START_CLAUSES)
        ;(function r(m) {
            neededClausesSet.add(m)
            if (m[RES]) {
                const { left, right } = m[RES]
                r(map[left])
                r(map[right])
            }
        })(match)
        
        const indexRemap = {}
        const neededClauses = [...neededClausesSet]
        .sort((a,b) => a[TAG] - b[TAG])
        .map((c,i) => {
            c[TAG] = indexRemap[c[TAG]] = i
            return c
        })
        .map(c => {
            if (c[RES]) {
                c[RES].left = indexRemap[c[RES].left]
                c[RES].right = indexRemap[c[RES].right]
            }
            return c
        })
        return neededClauses.map(toObj)
        // for (const c of neededClauses) {
        //     const { clause, index, resolution } = toObj(c)
        //     console.log(clause.padEnd(vars.length * 4) + index.padStart(4) + (resolution || ""))
        // }
    } else {
        return null
        // console.log("Not found")
    }

}