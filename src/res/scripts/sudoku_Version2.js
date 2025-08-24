// sudoku.js - JavaScript port of Python sudoku puzzle logic
// JS version produced by GitHub Copilot via the prompt "rewrite this in javascript"

class Entry {
    constructor(rowNum, colNum, squareNum, setValue = 0, maxValue = 9) {
        this.rowNum = rowNum;
        this.colNum = colNum;
        this.squareNum = squareNum;
        this.maxValue = maxValue;
        this.possibleValues = setValue > 0 ? [setValue] : Array.from({ length: maxValue }, (_, i) => i + 1);
    }

    eliminateValue(value) {
        this.possibleValues = this.possibleValues.filter(v => v !== value);
    }

    setValue(value) {
        this.possibleValues = [value];
    }

    toString() {
        return `(${this.rowNum}, ${this.colNum}, ${this.squareNum}): ${JSON.stringify(this.possibleValues)}`;
    }

    valueString(numChars, printSimple) {
        if (printSimple) {
            if (this.possibleValues.length === 0) return '  ';
            if (this.possibleValues.length === 1) return String(this.possibleValues[0]) + ' ';
            return '_ ';
        }
        const result = Array(numChars).fill(' ');
        for (let i = 0; i < this.possibleValues.length; i++) {
            result[i] = String(this.possibleValues[i]);
        }
        return result.join(' ') + ' ';
    }

    allPossibleValues() {
        this.possibleValues = Array.from({ length: this.maxValue }, (_, i) => i + 1);
    }
}

class BadAggregateException extends Error {
    constructor(aggregate, message) {
        super(message);
        this.aggregate = aggregate;
        this.name = "BadAggregateException";
    }
}

class RowOrColOrSquare {
    constructor(entries, aggregateType, index) {
        this.entries = entries;
        this.totalValues = entries.length + 1;
        this.aggregateType = aggregateType;
        this.index = index;
    }

    findForcedValues(tracing = false) {
        const seen = Array.from({ length: this.totalValues }, () => []);
        for (const entry of this.entries) {
            for (const value of entry.possibleValues) {
                seen[value].push(entry);
            }
        }
        const results = [];
        for (let i = 1; i < this.totalValues; i++) {
            if (seen[i].length === 1 && seen[i][0].possibleValues.length > 1) {
                results.push([i, seen[i][0]]);
                if (tracing) {
                    console.log(`value ${i} forced for ${this.aggregateType} ${this.index}`);
                }
            }
        }
        return results;
    }

    setForcedValues(tracing = false) {
        const newKnownValues = this.findForcedValues(tracing);
        if (newKnownValues.length > 0) {
            for (const [value, entry] of newKnownValues) {
                if (tracing) {
                    console.log(`Setting value of ${entry.toString()} to ${value}`);
                }
                entry.possibleValues = [value];
            }
        }
    }

    getKnownValues() {
        const result = [];
        for (const entry of this.entries) {
            if (entry.possibleValues.length === 1) result.push(entry.possibleValues[0]);
        }
        result.sort((a, b) => a - b);
        return result;
    }

    propagateKnownValues(tracing = false) {
        const knownValues = this.getKnownValues();
        if (knownValues.length === 0) return;
        if (tracing) {
            console.log(`Known values for ${this.aggregateType} ${this.index}: ${knownValues}`);
        }
        const knownSet = new Set(knownValues);
        for (const entry of this.entries) {
            if (entry.possibleValues.length === 1) continue;
            const newPossibleValues = entry.possibleValues.filter(v => !knownSet.has(v));
            if (tracing && newPossibleValues.length !== entry.possibleValues.length) {
                console.log(`New Possible values for entry ${entry.toString()}: ${newPossibleValues}`);
            }
            entry.possibleValues = newPossibleValues;
        }
    }

    printAggregate() {
        console.log(`Dump of ${this.aggregateType} ${this.index}`);
        for (const entry of this.entries) {
            console.log(entry.toString());
        }
    }

    consistent() {
        const knownEntry = Array(this.totalValues).fill(null);
        for (const entry of this.entries) {
            if (entry.possibleValues.length === 1) {
                const value = entry.possibleValues[0];
                if (knownEntry[value]) return false;
                knownEntry[value] = entry;
            }
            if (entry.possibleValues.length === 0) return false;
        }
        return true;
    }

    complete() {
        const seenValues = Array(this.totalValues).fill(false);
        for (const entry of this.entries) {
            for (const j of entry.possibleValues) {
                seenValues[j] = true;
            }
        }
        // Ignore seenValues[0]
        return seenValues.slice(1).every(v => v);
    }

    meetsConstraints() {
        return this.complete() && this.consistent();
    }

    check() {
        const knownValues = [];
        const seenValues = Array(this.totalValues).fill(false);
        for (const entry of this.entries) {
            if (entry.possibleValues.length === 1) {
                const value = entry.possibleValues[0];
                if (knownValues.includes(value)) {
                    throw new BadAggregateException(this, `Duplicate value ${value} in aggregate ${this.aggregateType}, index ${this.index}`);
                }
                knownValues.push(value);
            }
            for (const j of entry.possibleValues) {
                seenValues[j] = true;
            }
        }
        const missing = seenValues.slice(1).indexOf(false);
        if (missing >= 0) {
            throw new BadAggregateException(this, `Missing value ${missing + 1} in aggregate ${this.aggregateType}, index ${this.index}`);
        }
    }

    allPossibleValues() {
        return this.entries.reduce((sum, entry) => sum + entry.possibleValues.length, 0);
    }
}

class BadPuzzleException extends Error {
    constructor(puzzleString, message) {
        super(message);
        this.puzzleString = puzzleString;
        this.name = "BadPuzzleException";
    }
}

class SolutionCheckpoint {
    constructor(sudokuPuzzle, entry) {
        this.row = entry.rowNum;
        this.col = entry.colNum;
        this.entry = entry;
        this.possibleValues = [...entry.possibleValues];
        // Shuffle possible values
        for (let i = this.possibleValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.possibleValues[i], this.possibleValues[j]] = [this.possibleValues[j], this.possibleValues[i]];
        }
        this.checkpoint = sudokuPuzzle.generateCheckpoint();
        this.choice = null;
    }

    toString() {
        return `(${this.row}, ${this.col}): ${JSON.stringify(this.possibleValues)}`;
    }
}

class SudokuPuzzle {
    constructor(rowsInBlock = 3, colsInBlock = 3, initString = null) {
        this.totalValues = rowsInBlock * colsInBlock;
        this.rowsInBlock = rowsInBlock;
        this.colsInBlock = colsInBlock;
        this.entries = [];
        this.masterBoard = [];
        for (let i = 0; i < this.totalValues; i++) {
            for (let j = 0; j < this.totalValues; j++) {
                const squareNumber = Math.floor(i / rowsInBlock) * rowsInBlock + Math.floor(j / colsInBlock);
                this.entries.push(new Entry(i, j, squareNumber, 0, this.totalValues));
            }
        }
        this.rows = Array.from({ length: this.totalValues }, () => []);
        this.cols = Array.from({ length: this.totalValues }, () => []);
        this.squares = Array.from({ length: this.totalValues }, () => []);
        this.aggregates = [];
        this.checkpointStack = [];
        for (const entry of this.entries) {
            this.rows[entry.rowNum].push(entry);
            this.cols[entry.colNum].push(entry);
            this.squares[entry.squareNum].push(entry);
        }
        for (let i = 0; i < this.totalValues; i++) {
            this.aggregates.push(new RowOrColOrSquare(this.rows[i], 'row', i));
            this.aggregates.push(new RowOrColOrSquare(this.cols[i], 'col', i));
            this.aggregates.push(new RowOrColOrSquare(this.squares[i], 'square', i));
        }
        if (initString != null) {
            if (initString.length !== this.entries.length)
                throw new BadPuzzleException(initString, `Bad puzzle string ${initString}, length ${initString.length}.  required length is ${this.entries.length}`);
            const okCharacters = Array.from({ length: this.totalValues }, (_, i) => String(i + 1)).concat(['_']);
            const stringOk = [...initString].every(c => okCharacters.includes(c));
            if (!stringOk)
                throw new BadPuzzleException(initString, `Bad Puzzle string ${initString}, all characters must be in the list ${okCharacters}`);
            for (let i = 0; i < this.entries.length; i++) {
                if (initString[i] === '_') continue;
                this.entries[i].possibleValues = [parseInt(initString[i])];
            }
            this.masterPuzzle = this.generateCheckpoint();
        }
    }

    getEntry(row, col) {
        return this.entries[row * this.totalValues + col];
    }

    rowString(row, columnWidths, colsInBlock, printSimple) {
        let result = '|';
        let nextStop = colsInBlock - 1;
        for (let i = 0; i < row.length; i++) {
            result += row[i].valueString(columnWidths[i], printSimple);
            if (i === nextStop) {
                result += '|';
                nextStop += colsInBlock;
            }
        }
        return result;
    }

    printPuzzle(printSimple = false) {
        const columnWidths = Array(this.totalValues).fill(1);
        if (!printSimple) {
            for (const row of this.rows) {
                for (let i = 0; i < this.totalValues; i++) {
                    columnWidths[i] = Math.max(columnWidths[i], row[i].possibleValues.length);
                }
            }
        }
        let totalWidth = columnWidths.reduce((acc, x) => acc + 2 * x - 1, 0);
        totalWidth += columnWidths.length + 1 + this.rowsInBlock + 1;
        const blockString = '-'.repeat(totalWidth);
        let i = 0;
        console.log(blockString);
        for (const row of this.rows) {
            console.log(this.rowString(row, columnWidths, this.colsInBlock, printSimple));
            i += 1;
            if (i === this.rowsInBlock) {
                console.log(blockString);
                i = 0;
            }
        }
    }

    numBlankSquares(level = 'easy') {
        const blankPct = { easy: 0.55, medium: 0.6, hard: 0.66, evil: 0.7 };
        const totalSquares = this.entries.length;
        // Gaussian distribution
        const mean = blankPct[level];
        const variance = 0.0125;
        const pct = this.gaussianRandom(mean, variance);
        return Math.round(pct * totalSquares);
    }

    gaussianRandom(mean, variance) {
        // Box-Muller transform
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return Math.min(Math.max(mean + Math.sqrt(variance) * num, 0), 1);
    }

    doForcedMovesStep(tracing = false) {
        const totalPossibleValues = this.entries.reduce((sum, entry) => sum + entry.possibleValues.length, 0);
        for (const entryList of this.aggregates) {
            entryList.propagateKnownValues(tracing);
            entryList.setForcedValues(tracing);
        }
        if (tracing) this.printPuzzle();
        const newPossibleValues = this.entries.reduce((sum, entry) => sum + entry.possibleValues.length, 0);
        const newForcedValues = this.aggregates.reduce((sum, aggregate) => sum + aggregate.findForcedValues().length, 0);
        return (newPossibleValues < totalPossibleValues) || (newForcedValues > 0);
    }

    doForcedMoves(tracing = false) {
        let newFixedValue = true;
        let i = 0;
        while (newFixedValue) {
            newFixedValue = this.doForcedMovesStep(tracing);
            i += 1;
            if (i > 100) {
                console.log('oops! infinite loop!');
                tracing = true;
                this.printPuzzle();
            }
        }
    }

    findAllNeighborsOfEntry(entry, possibleValuesInAggregates) {
        const valuesInRow = possibleValuesInAggregates[entry.rowNum * 3];
        const valuesInCol = possibleValuesInAggregates[1 + entry.colNum * 3];
        const valuesInSquare = possibleValuesInAggregates[2 + entry.squareNum * 3];
        return valuesInRow + valuesInCol + valuesInSquare - 3 * entry.possibleValues.length;
    }

    findEntriesWithMinVals() {
        const entriesToConsider = this.entries.filter(entry => entry.possibleValues.length > 1);
        const entriesByPossValues = entriesToConsider.map(entry => [entry, entry.possibleValues.length]);
        entriesByPossValues.sort((a, b) => a[1] - b[1]);
        const minValue = entriesByPossValues[0][1];
        const eligibleEntries = entriesByPossValues.filter(x => x[1] === minValue);
        return eligibleEntries.map(x => x[0]);
    }

    findChoiceEntryForStack() {
        const valuesInEntries = this.entries.map(entry => entry.possibleValues.length).sort((a, b) => a - b);
        if (valuesInEntries[0] === 0) return [false, true, null];
        if (valuesInEntries[valuesInEntries.length - 1] === 1) return [true, false, null];
        const nextStackEntryChoice = this.findEntriesWithMinVals();
        return [false, false, nextStackEntryChoice[Math.floor(Math.random() * nextStackEntryChoice.length)]];
    }

    chooseBestValue(checkpoint, tracing = false) {
        this.restoreFromCheckpoint(checkpoint.checkpoint);
        let entry = checkpoint.entry;
        let nextChoice;
        if (checkpoint.possibleValues.length === 1) {
            checkpoint.choice = checkpoint.possibleValues.pop();
            nextChoice = checkpoint.choice;
        } else {
            let totalValues = this.entries.reduce((sum, entry) => sum + entry.possibleValues.length, 0);
            nextChoice = checkpoint.possibleValues[0];
            for (let nextValue of [...checkpoint.possibleValues]) {
                checkpoint.entry.possibleValues = [nextValue];
                this.doForcedMoves(false);
                if (this.testFeasible()) {
                    let nextValues = this.entries.reduce((sum, entry) => sum + entry.possibleValues.length, 0);
                    if (nextValues < totalValues) {
                        totalValues = nextValues;
                        nextChoice = nextValue;
                    }
                } else {
                    checkpoint.possibleValues = checkpoint.possibleValues.filter(v => v !== nextValue);
                }
                this.restoreFromCheckpoint(checkpoint.checkpoint);
            }
            checkpoint.choice = nextChoice;
            checkpoint.possibleValues = checkpoint.possibleValues.filter(v => v !== nextChoice);
        }
        if (tracing) {
            console.log(`Setting entry ${entry.toString()} to ${nextChoice}`);
        }
        checkpoint.entry.possibleValues = [nextChoice];
    }

    getNextSolution(tracing = false) {
        while (this.checkpointStack.length > 0) {
            let checkpoint = this.checkpointStack[this.checkpointStack.length - 1];
            this.chooseBestValue(checkpoint, tracing);
            if (checkpoint.possibleValues.length === 0) this.checkpointStack.pop();
            this.doForcedMoves(tracing);
            let [success, failure] = [false, false];
            if (tracing) this.printPuzzle();
            for (const aggregate of this.aggregates) {
                if (!aggregate.meetsConstraints()) {
                    failure = true;
                    break;
                }
            }
            if (failure) {
                if (tracing) console.log("Inconsistent puzzle");
                continue;
            }
            let [succ, fail, entry] = this.findChoiceEntryForStack();
            if (fail) {
                if (tracing) console.log("Inconsistent puzzle");
                continue;
            }
            if (succ) {
                if (tracing) console.log("Solved!");
                return true;
            }
            if (tracing) console.log(`Adding entry ${entry.toString()} to stack`);
            this.checkpointStack.push(new SolutionCheckpoint(this, entry));
        }
        if (tracing) console.log("No solution!");
        return false;
    }

    getFirstSolution(tracing = false) {
        this.restoreFromCheckpoint(this.masterPuzzle);
        this.doForcedMoves(tracing);
        let [success, failure, entry] = this.findChoiceEntryForStack();
        if (success || failure) {
            this.checkpointStack = [];
            if (tracing) {
                console.log(`Initial setup: success ${success}, failure ${failure}`);
            }
            return;
        }
        this.checkpointStack = [new SolutionCheckpoint(this, entry)];
        if (tracing) {
            console.log("Setting up solution, puzzle is ");
            this.printPuzzle();
        }
        this.getNextSolution(tracing);
    }

    check() {
        for (const entryList of this.aggregates) entryList.check();
    }

    generateCheckpoint() {
        return this.entries.map(entry => [...entry.possibleValues]);
    }

    restoreFromCheckpoint(checkpoint) {
        for (let i = 0; i < this.entries.length; i++) {
            this.entries[i].possibleValues = [...checkpoint[i]];
        }
    }

    dumpSolutionBoard() {
        return this.entries.map(entry => entry.possibleValues[0]);
    }

    compareToMaster() {
        const check = this.dumpSolutionBoard();
        return check.every((v, i) => v === this.masterBoard[i]);
    }

    getAllSolutions() {
        const solutions = [this.masterBoard];
        this.getFirstSolution();
        let nextSolution = this.dumpSolutionBoard();
        if (!this.arraysEqual(nextSolution, this.masterBoard)) {
            solutions.push(nextSolution);
        }
        while (this.getNextSolution()) {
            nextSolution = this.dumpSolutionBoard();
            if (solutions.some(sol => this.arraysEqual(sol, nextSolution))) continue;
            solutions.push(nextSolution);
        }
        return solutions;
    }

    arraysEqual(a, b) {
        return a.length === b.length && a.every((v, i) => v === b[i]);
    }

    countSolutions() {
        return this.getAllSolutions().length;
    }

    countUnknownSquares() {
        return this.entries.filter(entry => entry.possibleValues.length > 1).length;
    }

    testFeasible() {
        for (const entryList of this.aggregates) {
            if (!(entryList.consistent() && entryList.complete())) return false;
        }
        return true;
    }

    emptyBoard() {
        for (const entry of this.entries) {
            entry.possibleValues = Array.from({ length: this.totalValues }, (_, i) => i + 1);
        }
    }

    genRandomBoard(numRandom = -1) {
        if (numRandom === -1) numRandom = Math.floor((5 * this.totalValues) / 3);
        this.emptyBoard();
        const indices = [];
        for (let i = 0; i < numRandom; i++) {
            const index = this.setRandomEntry();
            if (index === -1) return null;
            indices.push(index);
        }
        return indices;
    }

    setRandomEntry() {
        while (this.testFeasible()) {
            const entryIndex = Math.floor(Math.random() * this.entries.length);
            const entry = this.entries[entryIndex];
            if (entry.possibleValues.length === 1) continue;
            const checkpoint = this.generateCheckpoint();
            const randIdx = Math.floor(Math.random() * entry.possibleValues.length);
            const value = entry.possibleValues[randIdx];
            entry.possibleValues = [value];
            this.doForcedMoves();
            if (this.testFeasible()) return entryIndex;
            this.restoreFromCheckpoint(checkpoint);
            entry.possibleValues = entry.possibleValues.filter(v => v !== value);
            this.doForcedMoves();
        }
        return -1;
    }

    generateBoardAndPuzzle(seedSquares = -1, level = "easy") {
        const blankSquares = this.numBlankSquares(level);
        let feasible = false;
        let dontTouch;
        while (!feasible) {
            dontTouch = this.genRandomBoard(seedSquares);
            if (!this.testFeasible()) continue;
            this.masterPuzzle = this.generateCheckpoint();
            this.getFirstSolution();
            feasible = this.testFeasible();
        }
        for (const solutionCheckpoint of this.checkpointStack) {
            dontTouch.push(this.totalValues * solutionCheckpoint.row + solutionCheckpoint.col);
        }
        this.masterBoard = this.dumpSolutionBoard();
        const okToBlankSquares = [];
        for (let i = 0; i < this.entries.length; i++) {
            if (!dontTouch.includes(i)) okToBlankSquares.push(i);
        }
        if (okToBlankSquares.length >= blankSquares) {
            this.shuffleArray(okToBlankSquares);
            for (let i = 0; i < blankSquares; i++) {
                this.blankSquare(okToBlankSquares[i]);
            }
            this.masterPuzzle = this.generateCheckpoint();
        } else {
            for (const idx of okToBlankSquares) {
                this.blankSquare(idx);
            }
            let numberRemaining = blankSquares - okToBlankSquares.length;
            this.masterPuzzle = this.generateCheckpoint();
            for (let i = 0; i < dontTouch.length; i++) {
                const index = dontTouch[i];
                this.blankSquare(index);
                const oldMaster = this.masterPuzzle;
                this.masterPuzzle = this.generateCheckpoint();
                if (this.noUniqueSolution()) {
                    this.masterPuzzle = oldMaster;
                } else {
                    numberRemaining -= 1;
                }
                this.restoreFromCheckpoint(this.masterPuzzle);
                if (numberRemaining === 0) break;
            }
        }
    }

    shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    noUniqueSolution() {
        this.getFirstSolution();
        if (!this.testFeasible()) return false;
        let nextSolution = this.dumpSolutionBoard();
        if (!this.arraysEqual(nextSolution, this.masterBoard)) return true;
        while (this.getNextSolution()) {
            if (!this.testFeasible()) return false;
            nextSolution = this.dumpSolutionBoard();
            if (!this.arraysEqual(nextSolution, this.masterBoard)) return true;
        }
        return false;
    }

    entryIndex(row, col) {
        return this.totalValues * row + col;
    }

    blankSquare(j) {
        this.entries[j].possibleValues = Array.from({ length: this.totalValues }, (_, i) => i + 1);
    }

    generateWebString() {
        let masterStr = '';
        let puzzleStr = '';
        for (let i = 0; i < this.entries.length; i++) {
            masterStr += String(this.masterBoard[i]);
            puzzleStr += this.entries[i].possibleValues.length > 1 ? '_' : String(this.masterBoard[i]);
        }
        return masterStr + '#' + puzzleStr;
    }
}

// Export if using Node.js module system
// module.exports = { Entry, RowOrColOrSquare, SudokuPuzzle, SolutionCheckpoint, BadAggregateException, BadPuzzleException };
