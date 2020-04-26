'use strict';

const BLOCK_SIZE = 64;
const BLOCK_GUTTER = 12;
const BLOCK_BORDER_COLOR = 'yellow';
const GAP_RADIUS = 6;
const SLOT_WIDTH = 260;
const SLOT_HEIGHT = 160;

const BORDER_TYPE = [
	// ┐
	[0, 0, 1, 1], [0, 0, -1, 1], [0, 0, -1, -1], [0, 0, 1, -1],

	// ┘
	[1, 0, 0, 1], [-1, 0, 0, 1], [-1, 0, 0, -1], [1, 0, 0, -1],

	// └
	[1, 1, 0 ,0], [-1, 1, 0 ,0], [-1, -1, 0 ,0], [1, -1, 0 ,0],

	// ┌
	[0, 1, 1, 0], [0, -1, 1, 0], [0, -1, -1, 0], [0, 1, -1, 0],

	// +
	[1, 1, 1, 1], // C(0/4)
	[-1, 1, 1, 1], [1, -1, 1, 1], [1, 1, -1, 1], [1, 1, 1, -1], // C(1/4)
	[-1, -1, 1, 1], [-1, 1, -1, 1], [-1, 1, -1, -1], [1, -1, -1, 1], [1, -1, -1, -1], [1, 1, -1, -1], // C(2/4)
	[1, -1, -1, -1], [-1, 1, -1, -1], [-1, -1, 1, -1], [-1, -1, -1, 1], // C(3/4)
	[-1, -1, -1, -1], // C(4/4)
];

function randInt(from, to) {
	return Math.round(Math.random() * (to - from)) + from;
}

const GAP_START = BLOCK_SIZE / 2 - GAP_RADIUS;
const GAP_END = BLOCK_SIZE / 2 + GAP_RADIUS;
const EDGE_START = BLOCK_GUTTER;
const EDGE_END = BLOCK_SIZE - BLOCK_GUTTER;

function PuzzleBlockPath() {
	const curvature = randInt(BLOCK_GUTTER / 2, BLOCK_GUTTER);
	const type = BORDER_TYPE[randInt(0, BORDER_TYPE.length - 1)];

	return function drawPath(ctx, x = 0, y = 0) {
		ctx.beginPath();
		ctx.moveTo(x + EDGE_START, y + EDGE_START);

		// T
		ctx.lineTo(x + GAP_START, y + EDGE_START);
		ctx.bezierCurveTo(
			x + GAP_START, y + EDGE_START - type[0] * curvature,
			x + GAP_END, y + EDGE_START - type[0] * curvature,
			x + GAP_END ,y + EDGE_START
		);
		ctx.lineTo(x + EDGE_END, y + EDGE_START);

		// R
		ctx.lineTo(x + EDGE_END, y + GAP_START);
		ctx.bezierCurveTo(
			x + EDGE_END + type[1] * curvature, y + GAP_START,
			x + EDGE_END + type[1] * curvature, y + GAP_END,
			x + EDGE_END, y + GAP_END
		);
		ctx.lineTo(x + EDGE_END, y + EDGE_END);

		// B
		ctx.lineTo(x + GAP_END, y + EDGE_END);
		ctx.bezierCurveTo(
			x + GAP_END, y + EDGE_END + type[2] * curvature,
			x + GAP_START, y + EDGE_END + type[2] * curvature,
			x + GAP_START, y + EDGE_END
		);
		ctx.lineTo(x + EDGE_START, y + EDGE_END);

		// L
		ctx.lineTo(x + EDGE_START, y + GAP_END);
		ctx.bezierCurveTo(
			x + EDGE_START - type[3] * curvature, y + GAP_END,
			x + EDGE_START - type[3] * curvature, y + GAP_START,
			x + EDGE_START, y + GAP_START
		);
		ctx.lineTo(x + EDGE_START, y + EDGE_START);
		ctx.closePath();
	};
}

function createCanvasHelper(width, height) {
	const canvasElement = document.createElement('canvas');

	canvasElement.width = width;
	canvasElement.height = height;

	return {
		element: canvasElement,
		ctx: canvasElement.getContext('2d')
	};
}

const [, port, source] = document.location.hash.split(';');

const canvas = {
	slot: createCanvasHelper(SLOT_WIDTH, SLOT_HEIGHT),
	block: createCanvasHelper(BLOCK_SIZE, BLOCK_SIZE),
	whole: createCanvasHelper(SLOT_WIDTH + BLOCK_SIZE, SLOT_HEIGHT)
};

const image = document.createElement('img');

image.src = `public/preset/${source}`;

function drawSlot(ctx, drawPath, offset) {
	ctx.drawImage(image, 0, 0);
	ctx.save();

	drawPath(ctx, offset.x, offset.y);
	ctx.clip();

	ctx.shadowColor = 'black';
	ctx.shadowBlur = 4;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	ctx.strokeStyle = 'rgba(0, 0, 0, .2)';
	ctx.lineWidth = 3;
	ctx.stroke();
	ctx.fillStyle = 'rgba(0, 0, 0, .15)';
	ctx.fill();

	ctx.restore();
}

function drawBlock(ctx, drawPath, offset) {
	ctx.clearRect(0, 0, SLOT_WIDTH, SLOT_HEIGHT);

	ctx.save();
	drawPath(ctx);

	ctx.shadowColor = BLOCK_BORDER_COLOR;
	ctx.shadowBlur = 4;
	ctx.strokeStyle = BLOCK_BORDER_COLOR;
	ctx.lineWidth = 2;
	ctx.clip();
	ctx.drawImage(image, -offset.x, -offset.y);
	ctx.stroke();

	ctx.restore();
}

window.addEventListener('load', function () {
	const ws = new WebSocket(`ws://127.0.0.1:${port}`);

	ws.addEventListener('open', () => ws.send(source));

	document.body.appendChild(image);
	document.body.appendChild(canvas.slot.element);
	document.body.appendChild(canvas.block.element);
	document.body.appendChild(canvas.whole.element);

	const commandMap = window.a = {
		fetch(offset) {
			const { block, slot, whole } = canvas;

			const drawPath = PuzzleBlockPath();

			drawBlock(block.ctx, drawPath, offset);
			drawSlot(slot.ctx, drawPath, offset);

			whole.ctx.clearRect(0, 0, SLOT_WIDTH + BLOCK_SIZE, SLOT_HEIGHT);
			whole.ctx.drawImage(slot.element, 0, 0);
			whole.ctx.drawImage(block.element, SLOT_WIDTH, 0);

			whole.element.toBlob(blob => ws.send(blob), 'image/png');
		}
	};

	ws.addEventListener('message', function (event) {
		const command = JSON.parse(event.data);

		commandMap[command.name](command.payload);
	});
});

