package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"syscall/js"
	"time"

	"github.com/aaronpowell/webpack-golang-wasm-async-loader/gobridge"
)

type grid struct {
	SizeX  int                 `json:"sizeX"`
	SizeY  int                 `json:"sizeY"`
	Filled map[string][]string `json:"filled"`
}

func (g *grid) isFilled(pos *position) bool {
	_, ok := g.Filled[fmt.Sprintf("%v-%v", pos.X, pos.Y)]
	return ok
}

type position struct {
	X    int `json:"x"`
	Y    int `json:"y"`
	Prev struct {
		X int `json:"x"`
		Y int `json:"y"`
	} `json:"prev"`
}

type move = string

const (
	moveForward   = move("FORWARD")
	moveStarboard = move("STARBOARD")
	moveLarboard  = move("LARBOARD")
)

type node struct {
	Depth    int
	Move     move
	Origin   *move
	Position position
}

type context struct {
	Register      *js.Value
	CorrelationID string
	Grid          *grid
	Scores        map[string]int
	Explored      map[string]*node
}

func play(this js.Value, args []js.Value) (interface{}, error) {
	p := new(position)
	if err := json.Unmarshal([]byte(args[2].String()), p); err != nil {
		return nil, err
	}

	g := new(grid)
	if err := json.Unmarshal([]byte(args[3].String()), g); err != nil {
		return nil, err
	}

	maxDepth := args[4].Int()

	ctx := context{
		Register:      &args[0],
		CorrelationID: args[1].String(),
		Grid:          g,
		Scores: map[string]int{
			moveForward:   0,
			moveStarboard: 0,
			moveLarboard:  0,
		},
		Explored: map[string]*node{},
	}

	nodes := []node{{
		Position: *p,
		Depth:    0,
	}}

	for depth := 0; depth <= maxDepth; depth++ {
		nodes = mergeChildren(&ctx, nodes)
		for _, n := range nodes {
			evaluateNode(&ctx, n)
		}
		evaluateContext(&ctx, depth)
	}

	return nil, nil
}

func evaluateNode(ctx *context, n node) {
	key := fmt.Sprintf("%v-%v", n.Position.X, n.Position.Y)
	if explored, ok := ctx.Explored[key]; ok {
		if explored.Depth < n.Depth && *explored.Origin != *n.Origin {
			ctx.Scores[*explored.Origin] = ctx.Scores[*explored.Origin] - explored.Depth
			ctx.Scores[*n.Origin] = ctx.Scores[*n.Origin] + n.Depth
			ctx.Explored[key] = &n
		}
	} else {
		ctx.Scores[*n.Origin] = ctx.Scores[*n.Origin] + n.Depth
		ctx.Explored[key] = &n
	}
}

func evaluateContext(ctx *context, depth int) {
	action := moveForward
	for m, score := range ctx.Scores {
		if score > ctx.Scores[action] {
			action = m
		}
	}

	ctx.Register.Invoke(ctx.CorrelationID, action, depth)
}

// Returns (FORWARD, STARBOARD, LARBOARD)
func moves(pos position) []position {
	dx := pos.X - pos.Prev.X
	dy := pos.Y - pos.Prev.Y

	moves := make([]position, 3)
	if dx != 0 {
		moves[0] = position{
			X: pos.X + dx,
			Y: pos.Y,
		}
		moves[1] = position{
			X: pos.X,
			Y: pos.Y + dx,
		}
		moves[2] = position{
			X: pos.X,
			Y: pos.Y - dx,
		}
	} else {
		moves[0] = position{
			X: pos.X,
			Y: pos.Y + dy,
		}
		moves[1] = position{
			X: pos.X - dy,
			Y: pos.Y,
		}
		moves[2] = position{
			X: pos.X + dy,
			Y: pos.Y,
		}
	}
	for i := range moves {
		moves[i].Prev.X = pos.X
		moves[i].Prev.Y = pos.Y
	}
	return moves
}

func mergeChildren(ctx *context, nodes []node) []node {
	merged := make([]node, 0)
	for _, n := range nodes {
		for _, child := range childrenNodes(ctx, &n) {
			merged = append(merged, child)
		}
	}
	return merged
}

func childrenNodes(ctx *context, parent *node) []node {
	nodes := make([]node, 0)
	positions := moves(parent.Position)
	if !isInvalid(&positions[0], ctx.Grid) {
		nodes = append(nodes, newNode(positions[0], parent, moveForward))
	}
	if !isInvalid(&positions[1], ctx.Grid) {
		nodes = append(nodes, newNode(positions[1], parent, moveStarboard))
	}
	if !isInvalid(&positions[2], ctx.Grid) {
		nodes = append(nodes, newNode(positions[2], parent, moveLarboard))
	}

	rand.Seed(time.Now().UnixNano())
	rand.Shuffle(len(nodes), func(i, j int) { nodes[i], nodes[j] = nodes[j], nodes[i] })

	return nodes
}

func newNode(pos position, parent *node, direction move) node {
	origin := parent.Origin
	if origin == nil {
		origin = &direction
	}
	return node{
		Depth:    parent.Depth + 1,
		Move:     direction,
		Position: pos,
		Origin:   origin,
	}
}

func isInvalid(pos *position, g *grid) bool {
	return pos.X < 0 || pos.Y < 0 || pos.X >= g.SizeX || pos.Y >= g.SizeY || g.isFilled(pos)
}

func main() {
	c := make(chan struct{}, 0)

	gobridge.RegisterCallback("play", play)

	<-c
}
