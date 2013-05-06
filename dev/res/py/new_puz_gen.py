#!/usr/bin/python2.7
import random
# Import modules for CGI handling 
import cgi, cgitb 
import json
import pdb

#
# enabled for test.  take it out otherwise
#

cgitb.enable()


#
# An entry on a Sudoku Board
# row is the row it belongs to
# col is the column
# square is the square number
# setValue is the value to which it is set
# maxValue is the maximim possible (values are 1 to maxValue)
# possible values is the set of possible values for this square
#

class Entry:
    def __init__(self, rowNum, colNum, squareNum, setValue = 0, maxValue = 9):
        self.rowNum = rowNum
        self.colNum = colNum
        self.squareNum = squareNum
        self.maxValue = maxValue
        if setValue > 0:
            self.possibleValues = [setValue]
        else:
            self.possibleValues = range(1, maxValue + 1)

    #
    # Remove value from the set of possible values
    #

    def eliminateValue(self, value):
        self.possibleValues.remove(value)

    #
    # Set the value of a square
    #

    def setValue(self, value):
        self.possibleValues = [value]

    #
    # pretty-print this entry
    #

    def __str__(self):
        return '(%d, %d, %d): ' % (self.rowNum, self.colNum, self.squareNum) + str(self.possibleValues)

    #
    # so it pretty-prints on the command-line
    #
    def __unicode__(self):
        return self.str()

    #
    # return  this entry in a readable form as part of a sudoku board.
    # In general, returns a blank-separated string of the current possibleValues,
    # with a trailing blank.
    # However, when print_simple = True, and all values are possible, returns "_ "
    # as the notation for a wildcard
    #

    def valueString(self, numChars, print_simple):
        if print_simple:
            if len(self.possibleValues) == 0: return '  '
            if len(self.possibleValues) == 1: return str(self.possibleValues[0]) + ' '
            return '_ '
        result = [' ' for i in range(0, numChars)]
        for i in range(0, len(self.possibleValues)):
            result[i] = str(self.possibleValues[i])
        return ' '.join(result) + ' '

    #
    # Sets this to have all possible values
    #

    def all_possible_values(self):
        self.possibleValues = range(1, self.maxValue + 1)

#
# An exception that is thrown when a puzzle SHOULD be well-defined
# but is not.  Carries a message as to what the problem was, and
# the aggregate (row or column or square) that caused the problem.
#

class BadAggregateException(Exception):
    def __init__(self, aggregate, message):
        self.message = message
        self.aggregate = aggregate

#
# A collection of elements which must have the values 1...totalValues
# entries: the entries in the collection.  This is an abstraction of a
# row, or a column, or a square in a sudoku board.
# entries: list of the entries (each is an Entry) in this aggregate
# totalValues: defined so a valid number is in this list range(1, totalValues).
#              In a 3x3 this will be 10.
# aggregate_type: A string giving which sort of aggregate this is.  It is one of
#                 'row', 'col', 'square'.  Used for error messages, etc.
# index:   The index of the aggregate, 0-based.  For rows and columns this is done in
#          the usual way (row 0 is the top row, column 0 is on the left).  Squares
#          start at the top left, and increase in row-major order: so for a 3x3,
#          the squares on top are 0, 1, 2, numbered right-to-left
#

class RowOrColOrSquare:
    def __init__(self, entries, aggregate_type, index):
        self.entries = entries
        self.totalValues = len(self.entries) + 1
        self.aggregate_type = aggregate_type
        self.index = index

    #
    # Find any forced values in the collection.  This will
    # be a value found in exactly one entry which has multiple
    # possibilities.  The general idea is that if a number
    # appears exactly once in an aggregate, AND there are other
    # possibilities in that square, then this is a forced value;
    # that entry's possibilities must be reduced to that number.
    # Returns a list of pairs (value, entry): entry is forced to value.  
    # The algorithm is straightforward.  seen is a list of entries indexed by value;
    # seen[i] is the list of entries where i in entry.possibleValues AND
    # len(entry.possibleValues) > 1.
    # i is a forced value if and only if len(seen[i]) == 1 [i has been seen
    # only once.
    #


    def find_forced_values(self):
        # Set up seen.  seen[0] is irrelevant, but twisting ourselves into
        # pretzels to make 1-based lists is ridiculous...
        seen = [[] for i in range(0, self.totalValues)]
        # Fill the seen array.  Iterate over the entries; if
        # len(entry.possibleValues) > 1, add entry to the list
        # seen[j] for each j in its possibleValues
        for entry in self.entries:
            if len(entry.possibleValues) == 1: continue
            for value in entry.possibleValues:
                seen[value].append(entry)
        results = []
        # At this point, seen[j] contains all the entries which
        # could have j in them.  If there is only one, that entry
        # is forced to be j, so add the pair (j, entry) to the
        # result list
        for i in range(1, self.totalValues):
            if len(seen[i]) == 1:
                results.append((i, seen[i][0]))
               
        return results

    #
    # Get the list of known values for this aggregate.
    # A value is known if it's the only possibiity for an
    # entry.  Ought to be a clever one-line list comprehension
    # for this
    #
    def get_known_values(self):
        result = []
        for entry in self.entries:
            if len(entry.possibleValues) == 1: result.append(entry.possibleValues[0])
        result.sort()
        return result

    #
    # propagate known values to all entries.  Just iterate over
    # all the entries with only one possible value, then add those
    # to the list of known values.  Then iterate over the entries
    # again, deleting the known values from the list
    #

    def propagate_known_values(self):
        known_values = self.get_known_values()
        if len(known_values) == 0: return
        known_values = set(known_values)
        # print known_values
        for entry in self.entries:
            if len(entry.possibleValues) == 1: continue
            entry.possibleValues = list(set(entry.possibleValues) - known_values)
            entry.possibleValues.sort()

    #
    # Print this aggregate
    #
           
    def print_aggregate(self):
        print 'Dump of %s %d' % (self.aggregate_type, self.index)
        for entry in self.entries: print str(entry)

    #
    # Is this aggregate consistent?  An aggregate is consistent if it
    # doesn't require that any value appear in more than one square, and
    # if every entry has at least one possible value.
    #

    def consistent(self):
        known_entry = [None for i in range(0, self.totalValues)]
        for entry in self.entries:
            if len(entry.possibleValues) == 1:
                value = entry.possibleValues[0]
                if known_entry[value]: return False
                known_entry[value] = entry
            if len(entry.possibleValues) == 0: return False
        return True

    #
    # is this aggregate complete?  An aggregate is complete if and only
    # if every value is contained in some entry.  Algorithm is simple:
    # seen_values[j] = True iff j is a possible value for some entry.  So
    # just iterate over the entries, setting seen_values[j] = True for all
    # j in entry.possibleValues.  Then return True iff seen_values[j] is True
    # for all j in (1, maximum Value)
    #

    def complete(self):
        seen_values = [False for i in range(0, self.totalValues)] # seen_values[0] is meaningless
        for entry in self.entries:
            for j in entry.possibleValues: seen_values[j] = True
        if False in seen_values[1:]: return False # look only at seen_values from 1 on...0 is meaningless
        return True

    #
    # Check if this aggregate is both consistent and complete
    #

    def meets_constraints(self):
        return self.complete() and self.consistent()

    #
    # Check and throw a BadAggregateException on failure.  This code essentially just repeats self.meets_constraints,
    # but tosses a BadAggregateException when inconsistent and incomplete.  This should ONLY be called in the event that you
    # would expect it to be OK.
    #
        
    def check(self):
        known_values = []
        seen_values = [False for i in range(0, self.totalValues)]
        for entry in self.entries:
            if len(entry.possibleValues) == 1:
                value = entry.possibleValues[0]
                if value in known_values:
                    raise BadAggregateException(self, "Duplicate value %d in aggregate %s, index %d" % (value, self.aggregate_type, self.index))
                known_values.append(value)
            for j in entry.possibleValues:
                seen_values[j] = True
        if False in seen_values[1:]:
            print seen_values
            raise BadAggregateException(self, "Missing value %d in aggregate %s, index %d" % (1 + (seen_values[1:].index(False)),  self.aggregate_type, self.index))

#
# A short test of aggregate operations...
#

def test_aggregate():
    entries = [Entry(0, 0, 0, 1), Entry(0, 1, 0, 2), Entry(0, 2, 0, 3), Entry(1, 0, 0), Entry(1, 1, 0), Entry(1, 2, 0), Entry(2, 0, 0), Entry(2, 1, 0), Entry(2, 2, 0)]
    entries[3].possibleValues = [4, 5]
    entries[4].possibleValues = [5, 6]
    entries[5].possibleValues = [6, 7, 8]
    entries[6].possibleValues = [7, 8, 9]
    entries[7].possibleValues = [7, 8, 9]
    entries[8].possibleValues = [7, 8, 9]
    square = RowOrColOrSquare(entries, 'square', 0)
    square.print_aggregate()
    keepGoing = True
    while keepGoing:
        keepGoing = square.propagate_known_values()
        square.print_aggregate()
        forced_values = square.find_forced_values()
        if len(forced_values) > 0:
            keepGoing = True
            for (value, entry) in forced_values:
                entry.possibleValues = [value]
            square.print_aggregate()
    square.print_aggregate()
        
class BadPuzzleException(Exception):
    def __init__(self, puzzle_string, message):
        self.puzzle_string = puzzle_string
        self.message = message
        
#
# A Sudoku puzzle: a representation of a board with blanks.  Some parameters:
# rows_in_block: the number of rows in a block
# cols_in_block: the number of columns in a block
# init_string: this is used when this is used as a solver, which we sometimes do for tests.  An initial string of length total_values^2, with an _
#              for a wildcard
#
# instance variables:
# total_values: the number of values in a row, column, or block (also called a square)
#              this is set by the size of the block, which is rows_in_block * cols_in_block
# entries: a list of the entries in the puzzle (see class entry above).  There are total_values * total_values
#          entries in the list
# rows: a list (length total_values) of lists of the entries in each row, each of which is a list of total_values[entries].
#       for example, in a 3x3 grid, rows[0] = [entries[0], entries[1], entries[2], entries[3]..., entries[8]
# cols: a list (length total_values) of lists of the entries in each column, each of which is a list of total_values[entries].
#       for example, in a 3x3 grid, cols[0] = [entries[0], entries[9], entries[18], entries[27]..., entries[80]
# squares: a list (length total_values) of lists of the entries in each row, each of which is a list of total_values[entries].
#       for example, in a 3x3 grid, squares[0] = [entries[0], entries[1], entries[2], entries[9], entries[10], entries[11], entries[18], entries[19], entries[20]
#
# aggregates: each row, column, or square is wrapped in a RowOrColOrSquare class, and the list of these is aggregates.
# checkpoint_stack: a stack of SolutionCheckpoints, used by the solver.
# master_board: the board.  This is generated by self.generate_board_and_puzzle.
# master_puzzle: the puzzle, which is master_board with some entries set free (how many depends on the level)
#
# We don't generate the puzzle in __init__, for reasons of modularity and transparency.  We can fix
# this when we're out of development.  For the moment,
# sudoku_puzzle = SudokuPuzzle(3, 3)
# sudoku_puzzle.generate_board_and_puzzle(15, 'hard')
#

class SudokuPuzzle:
    def __init__(self, rows_in_block = 3, cols_in_block = 3, init_string = None):
        self.total_values = rows_in_block * cols_in_block
        self.rows_in_block = rows_in_block
        self.cols_in_block = cols_in_block
        self.entries = []
        self.master_board = []
        #
        # Generate the entry array.  Initially, every entry is blank
        #
        for i in range(0, self.total_values):
            for j in range(0, self.total_values):
                squareNumber = (i/rows_in_block) * rows_in_block + j/cols_in_block
                self.entries.append(Entry(i, j, squareNumber, 0, self.total_values))

        #
        # Generate the rows and columns as list of entries.
        #
        self.rows = []
        self.cols = []
        self.squares = []
        for i in range(0, self.total_values):
            self.rows.append([])
            self.cols.append([])
            self.squares.append([])

        #
        # initialize the checkpoint_stack and generate the aggregates
        # It shouldn't matter, but the aggregates are stored in the
        # order [row_0, col_0, square_0, row_1, col_1, square_1, ..]
        #

        self.aggregates = []
        self.checkpoint_stack = []

        for entry in self.entries:
            self.rows[entry.rowNum].append(entry)
            self.cols[entry.colNum].append(entry)
            self.squares[entry.squareNum].append(entry)

        for i in range(0, self.total_values):
            self.aggregates.append(RowOrColOrSquare(self.rows[i], 'row', i))
            self.aggregates.append(RowOrColOrSquare(self.cols[i], 'col', i))
            self.aggregates.append(RowOrColOrSquare(self.squares[i], 'square', i))

        if init_string != None:
            if len(init_string) != len(self.entries):
                raise BadPuzzleException(init_string, 'Bad puzzle string %s, length %d.  required length is %d' % (init_string, len(init_string), len(self.entries)))
            ok_characters = [str(i) for i in range(1, self.total_values + 1)] + ['_']
            string_ok = reduce(lambda x, y: x and (y in ok_characters))
            if not string_ok:
                raise BadPuzzleException(init_string, 'Bad Puzzle string %s, all characters must be in the list %s' % (init_string, str(ok_characters)))
            for i in range(0, len(self.entries)):
                if init_string[i] == '_': continue
                self.entries[i].possibleValues = [int(init_string[i])]
            self.master_puzzle = self.generate_checkpoint()
                                         
                                         
                                                                                                                   

    #
    # Get the entry at (row, col).  Note these arrays are 0-based
    #

    def get_entry(self, row, col):
        return self.entries[row*self.total_values + col]

    #
    # get a string for a row appropriate for printing in a text
    # printout of a puzzle.  This is designed to be called
    # from print_puzzle, which will set up column widths.  print_simple
    # is a flag; when True, blank entries (all values possible) are printed as
    # _, not 1 2 3...9
    #

    def row_string(self, row, column_widths, cols_in_block, print_simple):
        result = '|'
        nextStop = cols_in_block - 1
        for i in range(0, len(row)):
            result += row[i].valueString(column_widths[i], print_simple)
            if (i == nextStop):
                result += '|'
                nextStop += cols_in_block
        return result
        
    #
    # Print a puzzle on a screen.  Designed mostly for debugging.  When
    # print_simple = True, print blank entries as _, not 1 2 3 ... 9.
    # All of this is just calculating the formatting and putting in enough
    # spaces to line columns up.  row_string takes are of ensuring that there
    # are enough blanks to align the columns, given instructions in column_widths
    #

    def print_puzzle(self, print_simple=False):
        column_widths = [1 for i in range(0, self.total_values)]
        #
        # compute the widths to hold the possible values (assume 1-digit numbers)
        #
        if not print_simple:
            for row in self.rows:
                for i in range(0, self.total_values):
                    column_widths[i] = max(column_widths[i], len(row[i].possibleValues))
        total_width = sum([2 * x - 1 for x in column_widths])
        #
        # add the widths for the spaces before the column entries
        #
        total_width += len(column_widths) + 1
        #
        # add the width for the block separators
        # (= self.rows_in_block) + 1 (for the end)
        #
        total_width += self.rows_in_block + 1
        #
        # The block_string is just an array of dashes wide enough to go
        # across the puzzle
        #
        block_string = ''.join(['-' for i in range(0, total_width)])
        i = 0
        #
        # Print it.  Iterate across the rows, printing the block_string after
        # every block
        #
        print block_string
        for row in self.rows:
            row_string = self.row_string(row, column_widths, self.cols_in_block, print_simple)
            print row_string
            i += 1
            if (i == self.rows_in_block):
                print block_string
                i = 0
    #
    # For the puzzle generator.  How many blank squares do I need?  By experiment
    # with websudoku, easy = 55% of the puzzle, medium 60%, hard 66%, evil 70%.
    # We use a random number generator around the mean, Gaussian distribution,
    # variance = 1.25%, or, on a 9x9 grid, about 1 square.
    #

    def num_blank_squares(self, level = 'easy'):
        blank_pct = {'easy': 0.55, 'medium': 0.6, 'hard': 0.66, 'evil': 0.7}
        total_squares = len(self.entries)
        total_blank_pct = random.gauss(blank_pct[level], .0125)
        return int(round(total_blank_pct * total_squares))
    #
    # Do a single step of forced moves.  A move is forced if and only if
    # a value is known to be in a square in an aggregate, and the value
    # is propagated to the other aquares (e.g., removed) or if it can be in
    # only one place in an aggregate (is a forced value).  Returns true
    # if and only if there is a possibility for more forced moves: if either
    # it's reduced the total number of entries (changed the board) or if there
    # are new forced values.  tracing is a debugging flag; when True, we print
    # out the puzzle.  This is the workhorse constraint propagator for the solver,
    # so bugs in the solver are likely here.
    #

    def do_forced_moves_step(self, tracing = False):
        #
        # Find the total possible values (sum of all of the possible values in all entries)
        # If we reduce this, we return True
        #
        total_possible_values = sum([len(entry.possibleValues) for entry in self.entries])
        #
        # For each aggregate, propagate the known values through the aggregate, then check
        # for forced values in the aggregate.  If there are any, set them
        #
        for entry_list in self.aggregates:
            entry_list.propagate_known_values()
            new_known_values = entry_list.find_forced_values()
            if len(new_known_values) > 0:
                for (value, entry) in new_known_values:
                    entry.possibleValues = [value]
        #
        # Done.  Print if we're debugging, and check if there is more work to do
        # First, check if we've changed the state of the puzzle: reduced the number of
        # total entries.  Second, check if we have exposed new forced values that we didn't
        # propsagate; return True if either of these conditions hold
        #
        if tracing: self.print_puzzle()
        new_possible_values = sum([len(entry.possibleValues) for entry in self.entries])
        new_forced_values = sum([len(aggregate.find_forced_values()) for aggregate in self.aggregates])
        return (new_possible_values < total_possible_values) or (new_forced_values > 0)

    #
    # do all the forced moves in the puzzle.  This is just an iteration over do_forced_moves_step;
    # keep calling this until it returns False.  Could be one routine, but transparency and atomicity
    #
                
    def do_forced_moves(self):
        new_fixed_value = True
        i = 0
        tracing = False
        while new_fixed_value:
            new_fixed_value = self.do_forced_moves_step(tracing)
            i += 1
            if (i > 100):
                print 'oops! infinite loop!'
                tracing = True
                self.print_puzzle()

    #
    # Find an entry with a minimum number of choices to put on the stack, returning
    # (is_solution, no_solution_possible, entry).  is_solution means that the
    # puzzle is solved: there are no further entries to put on the stack
    # no_solution_possible means the problem can't be solved; there is an entry
    # with zero possible values.  entry is the next entry to put on the stack,
    # and is not None iff is_solution = no_solution_possible = False
    #
    def find_choice_entry_for_stack(self):
        values_in_entries = [len(entry.possibleValues) for entry in self.entries]
        values_in_entries.sort()
        if values_in_entries[0] == 0: return (False, True, None)
        if values_in_entries[-1] == 1: return (True, False, None)
        #
        # Throw out all the 1 entries, sort again, just in case, then
        # pick the minimum
        #
        values_in_entries = [value for value in values_in_entries if value > 1]
        values_in_entries.sort()
        min_num_values = values_in_entries[0]
        #
        # list of entries to pick from
        #
        next_stack_entry_choice = [entry for entry in self.entries if len(entry.possibleValues) == min_num_values]
        #
        # Return a random entry from the list; prevents us from artifacts like
        # focussing on the top rows...
        #
        return (False, False, random.choice(next_stack_entry_choice))

    #
    # Solve a puzzle, with respect to the existing checkpoint stack.  This
    # method is designed to be re-entrant, so it doesn't clear the checkpoint stack.
    # This assumes the checkpoint stack has been initialized, so if it's empty there
    # are no more solutions
    #

    def get_next_solution(self):
        while len(self.checkpoint_stack) > 0:
            #
            # get the next solution from the checkpoint stack. Pop the
            # next value off the top entry on the stack.  Restore the saved
            # state in the checkpoint, then set the checkpoint's row and column to
            # the value we just popped.
            #
            checkpoint = self.checkpoint_stack[-1]
            next_value = checkpoint.possible_values.pop()
            checkpoint.choice = next_value
            self.restore_from_checkpoint(checkpoint.checkpoint)
            entry = self.get_entry(checkpoint.row, checkpoint.col)
            entry.possibleValues = [next_value]
            #
            # If that was the last value in the checkpoint, remove the checkpoint
            # from the stack
            #
            if len(checkpoint.possible_values) == 0: self.checkpoint_stack.pop()
            #
            # Propagate the choice and check for success (we have a solution)
            # or failure (conflict in some aggregate, or some square with no
            # possible values).  Also look for the next entry to push on the
            # stack, if need be; we just want one with the fewest remaining possible
            # values
            #
            self.do_forced_moves()
            (success, failure) = (False, False)
            #
            # Check for inconsistent aggregates
            #
            for aggregate in self.aggregates:
                if not aggregate.meets_constraints():
                    failure = True
                    break
            if failure: continue
            #
            # Now look for failure, success, or the next choice by counting
            # possible values in entries.  If any is 0, failure; if all are 1,
            # success; otherwise, find the smallest number of entries; one of
            # these entries will go on the stack
            #
            (success, failure, entry) = self.find_choice_entry_for_stack()
            if failure: continue 
            if success: return True 
            #
            # Generate a new value and put it on the stack, then continue
            #
            self.checkpoint_stack.append(SolutionCheckpoint(self, entry))
        #
        # Sigh.  ran out of choices and didn't generate a solution.  False...
        # Should never get here...
        #
        return False

    #
    # generate the first solution.  Just set the problem up by restoring from the
    # master puzzle
    #
    def get_first_solution(self):
        self.restore_from_checkpoint(self.master_puzzle)
        self.do_forced_moves()
        (success, failure, entry) = self.find_choice_entry_for_stack()
        if success or failure:
            self.checkpoint_stack = []
            return
        self.checkpoint_stack = [SolutionCheckpoint(self, entry)]
        self.get_next_solution()

    #
    # check: is this solution actually a solution?  When it's not,
    # throws a BadAggregateException
    #

    def check(self):
        for entry_list in self.aggregates: entry_list.check()

    #
    # Checkpoint the current state of the puzzle.  This is just the possible
    # values for each entry, as a list of lists.  Makes o copy of each list,
    # obviously, using the Python list constructor
    #
        

    def generate_checkpoint(self):
        return [list(entry.possibleValues) for entry in self.entries]
    #
    # Restore from a checkpoint, making a copy of the list on the
    # checkpoint...
    #

    def restore_from_checkpoint(self, checkpoint):
        for i in range(0, len(self.entries)):
            self.entries[i].possibleValues = list(checkpoint[i])

    #
    # Pull the board from a solution, as a list.  result[i] = self.entries[i].possibleValues[0]
    # note that this assumes the puzzle IS a solution len(entry.possibleValues) == 1 for all entry in
    # self.entries
    #

    def dump_solution_board(self):
        return [entry.possibleValues[0] for entry in self.entries]

    #
    # Check that the current state of the board is equal to the master
    # Note this should only be called when the puzzle is a solution
    #

    def compare_to_master(self):
        check = self.dump_solution_board()
        return check == self.master_board

    #
    # Get all the solutions to this puzzle, returning as a list of lists.
    # makes sure that there are no duplicates
    #

    def get_all_solutions(self):
        solutions = [self.master_board]
        self.get_first_solution()
        next_solution = self.dump_solution_board()
        if next_solution != self.master_board:
            solutions.append(next_solution)
        while(self.get_next_solution()):
            next_solution = self.dump_solution_board()
            if next_solution in solutions: continue
            solutions.append(next_solution)
        return solutions

    #
    # A utility to count all solutions
    #

    def count_solutions(self):
        return len(self.get_all_solutions())

    #
    # Count the squares in the puzzle without a known value
    #

    def count_unknown_squares(self):
        count = 0
        for entry in self.entries:
            if len(entry.possibleValues) == 1: continue
            count += 1
        return count

    #
    # Can this puzzle still have a solution?
    #

    def test_feasible(self):
        for entry_list in self.aggregates:
            if not (entry_list.consistent() and entry_list.complete()): return False
        return True

    #
    # set the board to all blanks
    #

    def empty_board(self):
        for entry in self.entries:
            entry.possibleValues = [i for i in range(1, self.total_values + 1)]

    #
    # Generate a random board, setting num_random entries in the board
    # to random values.  Do this somewhat carefully to make sure that we
    # don't generate an obviously infeasible board.  Returns the indices
    # of the entries set.  set_random_entry does the actual setting.  Returns
    # None if it couldn't do it. If num_random is set to -1, that's an indication
    # we should set it automatically, and 5/3 self.totalValues (10 for 6, 15 for 9)
    # has experimentally worked pretty well
    #

    def gen_random_board(self, num_random=-1):
        if num_random == -1: num_random = (5 * self.total_values)/3
        self.empty_board()
        indices = []
        for i in range(0, num_random):
            index = self.set_random_entry()
            if (index == -1): return None
            indices.append(index)
        return indices

    #
    # Set a random entry in a board to a random number.  Make sure it does nothing
    # obviously dumb: choosing an impossible value or setting two separate
    # entries in the same aggregate to a number.  Returns -1 if it simply could not
    # do it.
    #

    def set_random_entry(self):
        while self.test_feasible():
            #
            # Pick a random entry
            #
            entry_index = random.choice(range(0, len(self.entries)))
            entry = self.entries[entry_index]
            # check 1: this already set?  If so, try another
            if len(entry.possibleValues) == 1: continue
            # generate a checkpoint in case we want to back this one out
            checkpoint = self.generate_checkpoint()
            # set to a random value from its possible values, propagate
            # the value using do_forced_moves() and find out if we still have
            # a feasible puzzle.  if so, return the index; if not, restore from the
            # checkpoint, delete the value
            # (we've shown it is not a possible entry), propagate, and continue
            index = random.randint(0, len(entry.possibleValues) - 1)
            entry.possibleValues = [entry.possibleValues[index]]
            self.do_forced_moves()
            if self.test_feasible(): return entry_index
            self.restore_from_checkpoint(checkpoint)
            entry.possibleValues.pop(index)
            self.do_forced_moves()
        return -1

    #
    # Generate a random board, and a puzzle from it.  Sets self.master_board to the board,
    # and self.master_puzzle to the puzzle.  The constraint on the puzzle is it must solve to
    # master_board, and that must be the only solution.
    # seed_squares: the number of values to set randomly in the board to get stuff started
    # level: the level of difficulty of the puzzle: 'easy', 'medium', 'hard', 'evil'
    # the method is simple.  First, choose seed_squares at random and set them to random
    # values.  Then run the puzzle  through the solver.  This generates a board, which is the
    # master_board.  Then we must delete entries to make a puzzle, meeting the constraints
    # that the only valid solution to the puzzle is master_board.  We do this by first noting that
    # entries which were set as forced moves can be freely deleted; these are entries which were
    # neither in seed_squares nor are on checkpoint stack.  So delete those which can be freely deleted,
    # and then if we must delete more do it the hard way -- delete each one individually, then test if
    # the solution remains unique.  If it does, keep it clear.
    #
        

    def generate_board_and_puzzle(self, seed_squares = -1, level="easy"):

        #
        # Compute the number of squares we must blank for the chosen level
        #
        blank_squares = self.num_blank_squares(level)
        #
        # Choose seed_squares squares at random, and set them to random values
        # Make sure that the result is feasible; that is, that it is not self-contradictory
        # if it is, note it as the master puzzle, then generate a solution.  Use test_feasible
        # to check if the solution is in fact a solution; if it is, then we have a board, and proceed.
        # If not, the original puzzle had no solutions, so just pick a new set of random values and do it
        # again...
        # 
        feasible = False
        while not feasible:
            dont_touch = self.gen_random_board(seed_squares)
            if not self.test_feasible(): continue
            self.master_puzzle = self.generate_checkpoint()
            self.get_first_solution() # use the solver to generate a board...
            feasible = self.test_feasible()
        #
        # We can only touch forced-move squares; the rest are on the stack
        #
        for solution_checkpoint in self.checkpoint_stack:
            dont_touch.append(self.total_values * solution_checkpoint.row + solution_checkpoint.col)

        #
        # We have a solution, so note it
        #
        
        self.master_board = self.dump_solution_board()

        #
        # Compute the squares it is OK to blank; the ones not in dont_touch

        ok_to_blank_squares = []

        for i in range(0, len(self.entries)):
            if i in dont_touch: continue
            ok_to_blank_squares.append(i)

        #
        # If there are fewer squares to blank than squares that are safe to blank, we are very happy;
        # just blank them and be done.  (Randomize the order, first, so we don't get artifacts like lots
        # of nodes getting blanked in the top left).  When we're done, generate the master_puzzle by
        # taking a checkpoint.
        #

        if len(ok_to_blank_squares) >= blank_squares:
            random.shuffle(ok_to_blank_squares)
            for i in range(0, blank_squares):
                self.blank_square(ok_to_blank_squares[i])
            self.master_puzzle = self.generate_checkpoint()
        #
        # Otherwise we have to delete some squares that we actively made non-forced choices in, as well
        # Start by blanking all the forced-choice squares, then go through the dont_touch array (list of
        # entries we have to be careful blanking) one by one.  For each such square, first, save the old
        # master puzzle, then blank it and generate a new master puzzle by checkpointing after we've blanked
        # the square.  Then test; if the new master puzzle has no unique solutions, restore the old master (this
        # has the square unblanked and has a unique solution).  If the new master has a unique solution (which
        # must be the master board) then save it as the new master puzzle and note we've blanked one more
        # square.  The loop terminates when we've either blanked a sufficient number of squares or we run out
        # of candidates.  The loop invariant is self.master_puzzle has a unique solution and it is self.master_board
        #
        else:
            for i in range(0, len(ok_to_blank_squares)):
                self.blank_square(ok_to_blank_squares[i])
            number_remaining = blank_squares - len(ok_to_blank_squares)
            self.master_puzzle = self.generate_checkpoint()
            for i in range(0, len(dont_touch)):
                index = dont_touch[i]
                self.blank_square(index)
                old_master = self.master_puzzle
                self.master_puzzle = self.generate_checkpoint()
                if self.no_unique_solution():
                    self.master_puzzle = old_master
                else:
                    number_remaining -= 1
                self.restore_from_checkpoint(self.master_puzzle)
                if number_remaining == 0: break

   #
   # Test: does this puzzle have no unique solution?  Just iterate over all solutions;
   # if they are all equal to the puzzle master board, then there is a unique solution,
   # otherwise not
   #

    def no_unique_solution(self):
        self.get_first_solution()
        if not self.test_feasible(): return False
        next_solution = self.dump_solution_board()
        if next_solution != self.master_board: return True
        while self.get_next_solution():
            if not self.test_feasible(): return False
            next_solution = self.dump_solution_board()
            if next_solution != self.master_board: return True
        return False
        

    def entry_index(self, row, col):
        return self.total_values * row + col
          
    def blank_square(self, j):
        self.entries[j].possibleValues = range(1, self.total_values + 1)

    #
    # Generate the puzzle and the board as a string, of the form
    # <master string>#<puzzle string>.  The string is simply the board
    # in row-major order, and for the puzzle unknown squares are shown as _
    #
    
    def generate_web_string(self):
        master_str = ''
        puzzle_str = ''
        for i in range(0, len(self.entries)):
            master_str += str(self.master_board[i])
            puzzle_str += '_' if len(self.entries[i].possibleValues) > 1 else str(self.master_board[i])
        return master_str + '#' + puzzle_str

#
# A checkpoint for a SudokuPuzzle: this is what goes on the checkpoint stack
# row: the row number of the entry
# col: the column number of the entry
# possible_values: the possible values for the entry (order randomized; we always pop off
#                  the last, so randomize once to avoid artifacts)
# checkpoint: the state of the board   generated by SudokuPuzzle.generate_checkpoint()
# choice: the current choice for the value of the entry.  Used for debugging.
#

class SolutionCheckpoint:
    def __init__(self, sudokuPuzzle, entry):
        self.row = entry.rowNum
        self.col = entry.colNum
        self.possible_values = list(entry.possibleValues)
        random.shuffle(self.possible_values)
        self.checkpoint = sudokuPuzzle.generate_checkpoint()
        self.choice = None

    def __str__(self):
        return "(%d, %d): " % (self.row, self.col) + str(self.possible_values)


#
# invoke as a cgi or wsgi script.  Can return either html or json.  The
# general form of the get/post request (the Python code doesn't change between
# forms; I've only tested post) is:
# http://<server>/cgi-bin/new_puz_gen.py?response_type=res_type&rows=num_rows&cols=num_cols&level=level
# where:
#      res_type=html or json
#      num_rows is the number of rows in the block (NOT the total number of rows)
#      num_cols is the number of columns in the block (NOT the total number of columns)
#      leval=easy or medium or hard or evil
# so, for example, a typical easy puzzle would be generated by:
# http://<server>/cgi-bin/new_puz_gen.py?response_type=json&rows=3s&cols=3&level=easy
# Returns a string of the form master#puzzle.  Blanks are _'s in the string
#
        
if __name__ == '__main__':
    response_type = 'html'
    status = '200 OK'
    form = cgi.FieldStorage()
    response_type = 'json'
    if 'response_type' in form:
        response_type = form['response_type'].value
    elif 'resp' in form:
        response_type = form['resp'].value
    rows = 3
    if 'rows' in form:
        rows = int(form['rows'].value)
    elif 'r' in form:
        rows = int(form['rows'].value)
    cols = 3
    if 'cols' in form:
        cols = int(form['cols'].value)
    elif 'c' in form:
        cols = int(form['cols'].value)
    level = 'easy'
    if 'level' in form:
        level = form['level'].value
    elif 'd' in form:
        diff = int(form['d'].value)
        if diff == 4:
            level = 'evil'
        elif diff == 3:
            level = 'hard'
        elif diff == 2:
            level = 'medium'
        else:
            level = 'easy'
    
   
    if response_type == 'html': 
        puzzle = SudokuPuzzle(rows, cols, init_string = None)
        puzzle.generate_board_and_puzzle(level=level)
        result = puzzle.generate_web_string()
        print "Content-type:text/html\r\n\r\n"
        print "<html>"
        print "<head>"
        print "</head>"
        print "<body>"
        [master_board, puzzle_board] = result.split('#')
        print '<table cellspacing="10"><tr><td><table border="1">'
        num_values = rows * cols
        print "<tr>"
        i = 0
        for char in puzzle_board:
            if (i == num_values):
                print "</tr><tr>"
                i = 0
            print "<td>%s</td>" % (" " if char=="_" else char)
            i += 1
        print '</table></td><td><table border=1>'
        print "<tr>"
        i = 0
        for char in master_board:
            if (i == num_values):
                print "</tr><tr>"
                i = 0
            print "<td>" + char + "</td>"
            i += 1
        print "</table></td></tr></table>"
            
        print '<form action="http://127.0.0.1/cgi-bin/new_puz_gen.py" method="post">'
        print '<p> Rows:'
        print '<select id="rows" name="rows">'
        print '<option value="2">2</option>'
        print '<option value="3" selected>3</option>'
        print '<option value="4">4</option>'
        print '</select>'
        print 'Cols:'
        print '<select id="cols" name="cols">'
        print '<option value="2">2</option>'
        print '<option value="3" selected>3</option>'
        print '<option value="4">4</option>'
        print '</select>'
        print 'Level:'
        print '<select id="level" name="level">'
        print '<option value="easy" selected>easy</option>'
        print '<option value="medium" >medium</option>'
        print '<option value="hard" >hard</option>'
        print '<option value="evil">evil</option>'
        print '</select>'
        print '<input type="hidden" name="response_type" value="html">'
        print '<input type="submit" value="Do it!">'
        print "</body>"
        print "</html>"
    else:
        try:
            puzzle = SudokuPuzzle(rows, cols, init_string = None)
            puzzle.generate_board_and_puzzle(level=level)
            result = puzzle.generate_web_string()
        except Exception as inst:
            result = 'Exception ' + str(inst)
        print "Status: 200 OK"
        print "Content-type:application/json\r\n\r\n"
        print json.dumps({'board':result})
