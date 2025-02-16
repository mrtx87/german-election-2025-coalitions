<template>
    <div class="timeline-diagram-wrapper">
        <div style="font-weight: bolder;">Zeitlicher Verlauf der Umfrageergebnisse</div>
        <canvas v-on:mousemove="onMouseMove" @touchmove="onMouseMove" ref="_canvas" style=" background-color: #f6f6f6; border-radius: 4px;"></canvas>
    </div>
</template>

<script>
import {useAppStateStore} from "@/stores/app-state.ts";
import {getColor, sonstige, toDate} from "@/services/util.ts";

export class Vector2D {
    x;
    y;

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Vector2D(this.x, this.y);
    }

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    addX(x) {
        this.x += Number(x);
        return this;
    }

    addY(y) {
        this.y += y || 0;
        return this;
    }

    static of(vectorLike) {
        return new Vector2D(vectorLike.x, vectorLike.y);
    }
}

export class Drawer {
    //external states
    canvas;
    ctx;
    surveys;


    //internal states
    partyGraphsMap;
    highlightGraphId = null;
    x;
    y;
    horizontalEnd;
    marginTop;
    surveyDates;


    constructor(canvas, surveys) {
        this.canvas = canvas;
        this.surveys = surveys;
        this.updateRequiredDataForDrawing();
    }

    updateRequiredDataForDrawing() {
        const relativeWidth = Math.min(1280, window.innerWidth * 0.95);
        this.canvas.width = relativeWidth;
        this.canvas.height = relativeWidth / 2;
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';
        this.ctx = this.canvas.getContext("2d");
        this.updateBaseCoordinates();
        this.collectXAxisDatesAndPixelPositions(this.x, this.y, this.marginTop);
        this.generatePartyGraphVectors(this.surveys);
        this.renderDiagram();
    }

    updateBaseCoordinates() {
        this.x = this.canvas.width * 0.05;
        this.y = this.canvas.height - this.x;
        this.horizontalEnd = this.canvas.width * 0.99;
        this.marginTop = this.canvas.width * 0.01;
    }

    generatePartyGraphVectors(surveys) {
        const partyVectorsMap = this.collectResultsSortedByDate(surveys);
        this.generateVectorsForDrawing(partyVectorsMap);
        this.partyGraphsMap = partyVectorsMap;
    }

    collectResultsSortedByDate(surveys) {
        const partyVectorsMap = new Map();
        surveys.forEach(survey => {
            survey.results.forEach(r => {
                if (r.party.shortcut.toLowerCase() === sonstige) {
                    return;
                }
                const partyId = r.party.shortcut.startsWith('CDU') ? 'Union' : r.party.shortcut;
                let partyGraphEntry = partyVectorsMap.get(partyId);
                if (!partyGraphEntry) {
                    partyGraphEntry = {partyId, vectors: [], color: getColor(partyId)};
                    partyVectorsMap.set(partyId, partyGraphEntry);
                }
                partyGraphEntry.vectors.push({result: r.result, release: toDate(survey.release)});
            })
        });
        return partyVectorsMap;
    }

    generateVectorsForDrawing(partyVectorsMap) {
        for (let pv of partyVectorsMap.values()) {
            const availableHeight = this.canvas.height - (this.marginTop + this.x);
            pv.vectors.forEach(v => {
                const dateX = this.surveyDates.get(v.release);
                if (dateX) {
                    v.x = dateX;
                    v.y = (this.canvas.height - this.x) - (availableHeight * (2 * (v.result / 100)));
                }
            });
        }
    }


    renderDiagram() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawCoordinateSystem();
        this.drawLegend();
        this.drawGraphs();
        this.drawMetaInfo();
    }

    mousePosition;

    drawMetaInfo() {
        if (this.highlightGraphId) {
            const graph = this.partyGraphsMap.get(this.highlightGraphId);
            const lastVector = graph.vectors[graph.vectors.length - 1];
            this.drawText(this.highlightGraphId, new Vector2D(this.canvas.width * 0.92, lastVector.y + 3), {
                color: getColor(this.highlightGraphId),
                size: this.canvas.width * 0.014 + 'px'
            });
        }
    }

    drawCoordinateSystem() {
        const defaultOptions = {color: 'black', width: 1};
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
            this.drawText((10 * i) + '%', new Vector2D(marginLeft / 4, y + 5), {size: Math.min(12, marginLeft/2.5) +'px'});
            this.drawLine(new Vector2D(marginLeft - 4, y), new Vector2D(marginLeft + 4, y), {color: 'black'})
        }
    }

    drawHorizontalAxisPercentages(horizontalPosition, verticalPosition) {
        for (let [surveyDate, xPosition] of this.surveyDates) {
            this.drawText(surveyDate, new Vector2D(xPosition - 20, verticalPosition + 25));
            this.drawLine(new Vector2D(xPosition, verticalPosition - 5), new Vector2D(xPosition, verticalPosition + 5), {color: 'black'})
        }
    }

    collectXAxisDatesAndPixelPositions(horizontalPosition, verticalPosition, marginRight) {

        const step = ((this.canvas.width - (horizontalPosition + marginRight)) / this.surveys.length)
        let factor = 0;
        this.surveys.sort((d1, d2) => d1.release.getTime() - d2.release.getTime())
        this.surveyDates = this.surveys
            .map(s => toDate(s.release))
            .reduce((map, date) => {
                const x = (horizontalPosition + (step * factor));
                map.set(date, x);
                factor += 1;
                return map;
            }, new Map());
    }


    detectGraphToHighlight(mousePosition) {
        this.highlightGraphId = null;
        let abortOnDetectionSuccess = false;
        this.mousePosition = mousePosition;
        const graphs = this.partyGraphsMap.values();//].filter(pg => pg.partyId.toLowerCase() === 'linke')
        for (let graph of graphs) {
            for (let i = 0; i < graph.vectors.length - 1; i++) {
                const left = graph.vectors[i];
                const right = graph.vectors[i + 1];
                const gradient = (right.y - left.y) / (right.x - left.x);
                if (mousePosition.x < left.x || mousePosition.x > right.x) {
                    continue;
                }
                if (gradient !== 0) {
                    const projectedY = (gradient * mousePosition.x) + (left.y - (gradient * left.x));
                    if (Math.abs(projectedY - mousePosition.y) < 3) { //Math.round(projectedY) === Math.round(mousePosition.y)
                        console.log('hit on line calculation: ' + graph.partyId + i);
                        this.highlightGraphId = graph.partyId;
                        abortOnDetectionSuccess = true;
                        break;
                    }
                } else {
                    //console.log(graph.partyId + i + ' gradientZero', Math.floor(left.y), mousePosition.y, Math.ceil(left.y))
                    if (left.y - 2 <= mousePosition.y && mousePosition.y <= left.y + 2) {
                        console.log('hit on horizontal Axis:' + graph.partyId + i)
                        this.highlightGraphId = graph.partyId;
                        abortOnDetectionSuccess = true;
                        break;
                    }

                }
            }
            if (abortOnDetectionSuccess) {
                break;
            }
        }
        this.renderDiagram();
    }

    drawLegend() {
        const upperLeft = new Vector2D(this.canvas.width * 0.92, this.canvas.height * 0.04);
        const stepDown = this.canvas.height * 0.03;
        const startPosition = upperLeft.clone();
        const textSize = this.canvas.height * 0.0175;
        const endPosition = new Vector2D(startPosition.x + stepDown, startPosition.y);
        for (let partyId of this.partyGraphsMap.keys()) {
            const color = getColor(partyId);
            this.drawLine(startPosition, endPosition, {color: color, width: textSize / 3});
            this.drawText(partyId, endPosition
                    .clone()
                    .addX(textSize)
                    .addY(textSize / 2.5),
                {size: textSize + 'px', color: color});
            startPosition.y += stepDown;
            endPosition.y += stepDown;
        }
    }

    drawGraphs() {
        const graphs = [...this.partyGraphsMap.values()];
        if (this.highlightGraphId) {
            graphs.sort((g1, g2) => {
                if (g1.partyId === this.highlightGraphId) {
                    return 1;
                }
                if (g2.partyId === this.highlightGraphId) {
                    return -1;
                }
                return 0;
            });
            console.log(graphs.map(g => g.partyId))
        }
        for (let graph of graphs) {
            const highlightGraph = this.highlightGraphId === graph.partyId;
            this.drawGraph(graph.vectors, {
                color: graph.color || 'grey',
                width: highlightGraph ? 3 : 1,
                radius: highlightGraph ? 5 : 3,
                highlight: highlightGraph
            });
        }
    }

    drawGraph(vectors, options) {
        for (let i = 0; i < vectors.length; i++) {
            const from = vectors[i];
            if (i < vectors.length - 1) {
                const to = vectors[i + 1];
                this.drawLine(from, to, options)
            }
            this.drawDot(from, options);
            if (options.highlight) {
                this.drawText(from.result + '%', Vector2D.of(from).addY(this.canvas.width * -0.01), {size: this.canvas.width * 0.01 + 'px'})
            }
        }
    }

    drawDot(position, options = {color: 'black', radius: 2}) {
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, options.radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = options.color || 'black';
        this.ctx.fill();
    }

    drawText(text, position, options = {color: 'black', size: '11px'}) {
        this.ctx.font = options.size + " arial";
        this.ctx.fillStyle = options.color || 'black';
        this.ctx.fillText(text, position.x, position.y);
    }

    drawLine(from, to, options = {color: 'black', width: 1}) {
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.lineWidth = options.width || 1;
        this.ctx.strokeStyle = options.color || 'black';
        this.ctx.stroke();
    }

    drawRect(upperLeftPosition, size, options = {color: 'black', rounded: 5}) {
        this.ctx.beginPath(); // Start a new path
        if (!options.rounded) {
            this.ctx.rect(upperLeftPosition.x, upperLeftPosition.y, size.x, size.y);
        } else {
            this.ctx.roundRect(upperLeftPosition.x, upperLeftPosition.y, size.x, size.y, [options.rounded, options.rounded]);
        }
        this.ctx.fillStyle = options.color || 'black';
        this.ctx.fill(); // Render the path
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
        this.drawer = new Drawer(this.canvas, this.filterSurveys(this.surveys));
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
        onMouseMove(e) {
            const canvasMousePosition = this.translateMousePositionToCanvas(e);
            this.drawer.detectGraphToHighlight(canvasMousePosition);
        },
        translateMousePositionToCanvas(rawMousePosition) {
            const rect = this.canvas.getBoundingClientRect(); // Canvas Position
            const scaleVector = new Vector2D(this.canvas.width / rect.width, this.canvas.height / rect.height);   // Skalierung berechnen
            return new Vector2D((rawMousePosition.clientX - rect.left) * scaleVector.x, (rawMousePosition.clientY - rect.top) * scaleVector.y);
        },
        filterSurveys(surveys) {
            return surveys.reduce((filteredSurveys, survey) => {
                if (filteredSurveys.find(s => s.release.getTime() === survey.release.getTime())) {
                    return filteredSurveys;
                }
                filteredSurveys.push(survey);
                return filteredSurveys;
            }, [])
        }
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
