const BLOCK_SIZE = 64;
const BLOCK_GUTTER = 12;
const BLOCK_BORDER_COLOR = 'yellow';
const GAP_RADIUS = 6;

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

function PuzzleBlockPath(options) {
	const curvature = randInt(BLOCK_GUTTER / 2, BLOCK_GUTTER);
	const type = BORDER_TYPE[randInt(0, BORDER_TYPE.length - 1)];

	console.log(type, curvature);

	return function drawPath(ctx) {
		ctx.beginPath();
		ctx.moveTo(EDGE_START, EDGE_START);

		// T
		ctx.lineTo(GAP_START, EDGE_START);
		ctx.bezierCurveTo(
			GAP_START, EDGE_START - type[0] * curvature,
			GAP_END, EDGE_START - type[0] * curvature,
			GAP_END ,EDGE_START
		);
		ctx.lineTo(EDGE_END, EDGE_START);

		// R
		ctx.lineTo(EDGE_END, GAP_START);
		ctx.bezierCurveTo(
			EDGE_END + type[1] * curvature, GAP_START,
			EDGE_END + type[1] * curvature, GAP_END,
			EDGE_END, GAP_END
		);
		ctx.lineTo(EDGE_END, EDGE_END);

		// B
		ctx.lineTo(GAP_END, EDGE_END);
		ctx.bezierCurveTo(
			GAP_END, EDGE_END + type[2] * curvature,
			GAP_START, EDGE_END + type[2] * curvature,
			GAP_START, EDGE_END
		);
		ctx.lineTo(EDGE_START, EDGE_END);

		// L
		ctx.lineTo(EDGE_START, GAP_END);
		ctx.bezierCurveTo(
			EDGE_START - type[3] * curvature, GAP_END,
			EDGE_START - type[3] * curvature, GAP_START,
			EDGE_START, GAP_START
		);
		ctx.lineTo(EDGE_START, EDGE_START);
	}
}

function createCanvasHelper(width, height) {
	const canvasElement = document.createElement('canvas');

	canvasElement.width = width;
	canvasElement.height = height;
	document.body.appendChild(canvasElement);

	return {
		element: canvasElement,
		ctx: canvasElement.getContext('2d')
	};
}

const port = location.hash.match(/^#(\d+)/)[1];
const ws = new WebSocket(`ws://127.0.0.1:${port}`);

window.addEventListener('load', function () {
	const image = document.createElement('img');

	image.src = 'preset/whole.png';
	document.body.appendChild(image);

	function drawSlot(ctx, drawPath, offsetTop, offsetLeft) {
		ctx.drawImage(image, 0, 0);
		ctx.save();

		drawPath(ctx);
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

	function drawBlock(ctx, drawPath) {
		ctx.save();

		drawPath(ctx);

		ctx.shadowColor = BLOCK_BORDER_COLOR;
		ctx.shadowBlur = 4;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 0;
		ctx.strokeStyle = BLOCK_BORDER_COLOR;
		ctx.lineWidth = 2;
		ctx.clip();
		ctx.drawImage(image, -60, -60);
		ctx.stroke();
	}

	const canvas = {
		slot: createCanvasHelper(260, 160),
		block: createCanvasHelper(BLOCK_SIZE, BLOCK_SIZE)
	};
	
	image.addEventListener('load', function () {
		const drawPath = PuzzleBlockPath();

		drawBlock(canvas.block.ctx, drawPath);
		drawSlot(canvas.slot.ctx, drawPath)

		canvas.block.element.toBlob(function (blob) {
			ws.send(blob);
		}, 'image/png');
	});

	
});

