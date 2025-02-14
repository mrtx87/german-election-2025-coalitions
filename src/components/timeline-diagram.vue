<template>
    <div class="timeline-diagram-wrapper">
        <canvas ref="_canvas" style="border: 1px solid black;"></canvas>
    </div>
</template>

<script>
import {useAppStateStore} from "@/stores/app-state.ts";
import {getColor, sonstige, toDate} from "@/services/util.ts";
import moment from "moment";

export class Vector2D {
    x;
    y;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class Drawer {
    canvas;
    ctx;
    surveys;
    pastDays;

    x;
    y;
    horizontalEnd;
    marginTop;

    constructor(canvas, surveys) {
        this.canvas = canvas;
        this.surveys = surveys;
        this.updateRequiredDataForDrawing();
    }

    updateRequiredDataForDrawing() {
        const relativeWidth = Math.min(1280, window.innerWidth * 0.8);
        this.canvas.width = relativeWidth;
        this.canvas.height = relativeWidth / 2;
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';
        this.ctx = this.canvas.getContext("2d");
        this.updateBaseCoordinates();
        this.collectXAxisDatesAndPixelPositions(this.x, this.y, this.marginTop);
        this.generatePartyGraphVectors(this.surveys);
    }

    updateBaseCoordinates() {
        this.x = this.canvas.width * 0.05;
        this.y = this.canvas.height - this.x;
        this.horizontalEnd = this.canvas.width * 0.99;
        this.marginTop = this.canvas.width * 0.01;
    }

    toDate(date) {
        return moment(date).format('DD.MM.YY');
    }
    generatePartyGraphVectors(surveys) {
        const partyVectors = new Map();
        surveys.forEach(s => {
            s.results.forEach(r => {
                if (r.party.shortcut.toLowerCase() === sonstige) {
                    return;
                }
                const partyId = r.party.shortcut.startsWith('CDU') ? 'Union' : r.party.shortcut;
                let partyGraphEntry = partyVectors.get(partyId);
                if (!partyGraphEntry) {
                    partyGraphEntry = {partyId, vectors: [], color: getColor(partyId)};
                    partyVectors.set(partyId, partyGraphEntry);
                }

                partyGraphEntry.vectors.push({result: r.result, release: toDate(s.release)});
            })
        });

        for (let pv of partyVectors.values()) {
            pv.vectors = pv.vectors.reduce((filtered, elem) => {
                if (filtered.find(r => r.release === elem.release)) {
                    return filtered;
                }
                filtered.push(elem);
                return filtered;
            }, [])
        }

        for (let pv of partyVectors.values()) {
            const availableHeight = this.canvas.height - (this.marginTop + this.x);
            pv.vectors.forEach(v => {
                const pDay = this.pastDays.find(pd => pd.date === v.release);
                if (pDay) {
                    v.x = pDay.x;
                    v.y = (this.canvas.height - this.x) - (availableHeight * (2 * (v.result / 100)));

                }
            });
        }
        this.partyVectors = partyVectors;
        console.log(partyVectors)

    }

    partyVectors;

    loop() {
        setTimeout(function () {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawCoordinateSystem();
            this.drawGraphs();

            this.loop();
        }.bind(this), 250)
    }

    drawCoordinateSystem() {
        const defaultOptions = {color: 'black'};
        const cornerVector = new Vector2D(this.x, this.y);
        this.drawLine(cornerVector, new Vector2D(this.x, this.marginTop), defaultOptions);
        this.drawLine(cornerVector, new Vector2D(this.horizontalEnd, this.y), defaultOptions);
        this.drawVerticalAxisPercentages(this.y, this.marginTop, this.x);
        this.drawHorizontalAxisPercentages(this.x, this.y);
    }

    drawVerticalAxisPercentages(verticalPosition, marginTop, marginLeft) {
        const stepAmount = 5;
        const step = ((this.canvas.height - (marginTop + marginLeft)) / stepAmount)
        for (let i = 0; i <= stepAmount; i++) {
            const y = (verticalPosition - (step * i));
            this.drawText((10 * i) + '%', new Vector2D(marginLeft / 3, y + 5));
            this.drawLine(new Vector2D(marginLeft - 4, y), new Vector2D(marginLeft + 4, y), {color: 'black'})
        }
    }

    drawHorizontalAxisPercentages(horizontalPosition, verticalPosition) {
        for (let pastDay of this.pastDays) {
            this.drawText(pastDay.date, new Vector2D(pastDay.x - 20, verticalPosition + 25));
            this.drawLine(new Vector2D(pastDay.x, verticalPosition - 5), new Vector2D(pastDay.x, verticalPosition + 5), {color: 'black'})
        }
    }

    collectXAxisDatesAndPixelPositions(horizontalPosition, verticalPosition, marginRight) {
        const stepAmount = 7;
        const pastDays = stepAmount - 1;
        this.pastDays = [];
        const step = ((this.canvas.width - (horizontalPosition + marginRight)) / stepAmount)
        for (let i = 0; i < stepAmount; i++) {
            const dateString = moment().subtract(pastDays - i, 'days').format('DD.MM.YY');
            const x = (horizontalPosition + (step * i));
            this.pastDays.push({date: dateString, x});
        }
    }

    drawGraph(vectors, options) {
        for (let i = 0; i < vectors.length; i++) {
            const from = vectors[i];
            if (i < vectors.length - 1) {
                const to = vectors[i + 1];
                this.drawLine(from, to, options)
            }
            this.drawDot(from, options)
        }
    }

    drawDot(position, options) {
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, options.radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = options.color;
        this.ctx.fill();
    }

    drawGraphs() {
        for (let pv of this.partyVectors.values()) {
            this.drawGraph(pv.vectors, {color: pv.color, radius: 3});
        }
    }

    drawText(text, position, color = 'black') {
        this.ctx.font = "11px arial";
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, position.x, position.y);
    }

    drawLine(from, to, options) {

        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        if (options) {
            this.ctx.lineWidth = options.width || 1;
            this.ctx.strokeStyle = options.color || 'black';
        }
        this.ctx.stroke();
    }

    drawLineSegments(vectors, options) {

        if (vectors.length < 2) {
            return;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(vectors[0].x, vectors[0].y)
        for (let i = 1; i < vectors.length; i++) {
            const lineTo = vectors[i];
            this.ctx.lineTo(lineTo.x, lineTo.y);
        }
        if (options) {
            this.ctx.lineWidth = options.width || 1;
            this.ctx.strokeStyle = options.color || 'black';
        }
        this.ctx.stroke();
    }
}

export default {
    name: "timeline-diagram",
    components: {},
    created() {
        this.appStore = useAppStateStore();
        window.addEventListener("resize", this.resizeHandler);
    },
    unmounted() {
        window.removeEventListener("resize", this.resizeHandler);
    },
    mounted() {
        this.canvas = this.$refs._canvas;
        this.drawer = new Drawer(this.canvas, this.surveys);
        this.drawer.loop();
    },
    data: function () {
        return {
            appStore: null,
            canvas: null,
            drawer: null
        }
    },
    methods: {
        resizeHandler() {
            this.drawer.updateRequiredDataForDrawing();
        },
        isSonstige(partyResult) {
            return partyResult.party.shortcut.toLowerCase() === sonstige;
        },
    },
    computed: {
        surveys() {
            return this.appStore.surveys;
        }
    }
};
</script>

<style lang="scss" scoped>

.timeline-diagram-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 3px;
}


</style>
