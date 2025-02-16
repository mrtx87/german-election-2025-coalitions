<template>
    <div class="app-content">
        <div class="subheading">Umfragen zur Bundestagswahl 2025 der letzten 14 Tage</div>
        <div class="survey-nav">
            <div class="survey-items">
                <div class="survey-item" v-on:click="selectSurvey(survey.id)" v-for="survey in surveys"
                     v-bind:key="survey.id" :class="{'selected': survey.id === selectedSurveyId }"
                     :title=" survey?.institute.name + ' - ' +  toDate(survey.surveyPeriod.start) + ' - ' + toDate(survey.surveyPeriod.end) + ' | ' + survey.participants + ' Teilnehmer'">
                    <div class="institute-name">
                        {{ survey?.institute.name }}
                    </div>
                    <div class="release-date">{{ toDate(survey?.release) }}</div>
                </div>
            </div>
        </div>
        <div class="survey-playground-wrapper">
            <div class="playground">
                <div style="display:flex; flex-direction: column;" v-if="selectedSurveyId">
                    <span style="  font-weight: bolder">Stimmanteil der
                        Parteien
                    </span>
                    <span style="font-size: 13px;">
                        {{ selectedSurvey?.institute.name }} {{ toDate(selectedSurvey?.release) }}
                        {{ changed ? '(geändert)' : ''}}
                    </span>
                </div>
                <select-party-value v-bind:partyResult="partyResult"
                                    v-bind:forcedDisabled="Boolean(changesToRender.length)"
                                    v-on:onLockChange="handleLockChange"
                                    v-on:onResultChange="handleResultChange"
                                    v-for="partyResult in editingSurvey?.results"
                                    :key="partyResult"></select-party-value>
                <div class="playground-footer-panel" v-if="selectedSurveyId">
                    <div>Summe:
                        {{ editingSurvey?.results?.reduce((sum, v) => sum + v.result, 0) }}%
                    </div>
                    <button v-on:click="reset" class="default-button">zurücksetzen</button>
                </div>
            </div>
            <div class="coalition-results">
                <div style="font-weight: bolder;" v-if="selectedSurveyId">
                    Mögliche Koalitionen basierend auf ihrer Auswahl
                </div>
                <div class="coalition-results-content">
                    <coalition-diagram v-for="coalition in allCoalitions" v-bind:key="coalition.id"
                                       v-bind:coalitionData="coalition"></coalition-diagram>
                </div>
            </div>
        </div>

        <div class="optional" v-if="selectedSurveyId">
            <div class="optional-title"
                 title="Über die sogenannte Grundmandatsklausel kann eine Partei auch dann gemäß ihrem Stimmenanteil ins Parlament einziehen, wenn sie die Fünfprozenthürde verpasst. Voraussetzung ist, dass sie in mindestens drei Wahlkreisen ein Direktmandat gewinnt.">
                <span>Auswählen ob Partei über die Grundmandatsklausel einzieht</span>
                (<img class="star" src="@/assets/star.svg">)
            </div>
            <div class="not-made-the-hurdle">
                <button class="hurdle-elem" v-for="optional in optionals" v-bind:key="optional"
                        v-on:click="handleHurdleExceptionChange(optional, !optional.exception)">
                    <img src="@/assets/star.svg" v-if="optional.exception">
                    <span>{{ optional.party.shortcut }}</span>
                </button>
            </div>
        </div>
        <timeline-diagram v-if="surveys.length"></timeline-diagram>
    </div>
</template>

<script>
import {useAppStateStore} from "@/stores/app-state.ts";
import {Polls, Query, Order, DataType} from 'german-election-polls';
import moment from "moment/moment";
import SelectPartyValue from "@/components/select-party-value.vue";
import {deepCloneObject, HURDLE, sonstige, toDate} from "@/services/util.ts";
import CoalitionDiagram from "@/components/coalition-diagram.vue";
import TimelineDiagram from "@/components/timeline-diagram.vue";

export class CoalitionMap {
    _map;

    constructor() {
        this._map = new Map();
    }

    addSafe(coalition) {
        let coalitionByPartyAmount = this._map.get(coalition.partys.length);
        if (!coalitionByPartyAmount) {
            coalitionByPartyAmount = []
            this._map.set(coalition.partys.length, coalitionByPartyAmount);
        }
        coalitionByPartyAmount.push(coalition);
    }

    keys() {
        return this._map.keys();
    }

    getAllCoalitions() {
        let allCoals = [];
        const keys = [...this._map.keys()]
        keys.sort();
        for (let key of keys) {
            const coalitions = this._map.get(key);
            allCoals = [...allCoals, ...coalitions];
        }
        allCoals.sort(this.sortByPartnersAndSum)
        return allCoals;
    }

    sortByPartnersAndSum(c1, c2) {
        const lengthDiff = c1.partys.length - c2.partys.length;
        if (lengthDiff === 0) {
            return c2.sum - c1.sum;
        }
        return lengthDiff;
    }
}

export class Coalition {
    partys;
    sum;
    id;

    constructor(partys, sum, id) {
        this.partys = partys;
        this.id = id;
        this.sum = sum;
    }
}

export default {
    name: "App-Content",
    components: {
        TimelineDiagram,
        CoalitionDiagram,
        SelectPartyValue
    },
    created() {
        this.appStore = useAppStateStore();
        this.updatePolls();
    },
    data: function () {
        return {
            appStore: null,
            changesToRender: [],
            counts: 0
        }
    },
    methods: {
        toDate: function (date) {
            return toDate(date);
        },
        async updatePolls() {
            const polls = new Polls();
            await polls.update();
            const date = moment().subtract(14, 'days').toDate();
            const query = polls.select([
                Query.include([DataType.Surveys]),
                Query.Survey.Release.isGreater(date),
                Query.Survey.Parliament.Shortcut.is(['Bundestag']),
                Query.Survey.Sort.byParticipants(Order.Asc),
                Query.Survey.Sort.allResults(Order.Desc),
            ]);
            this.sortSurveys(query.surveys);
            this.appStore.setSurveys(query.surveys);
            if (!this.selectedSurveyId) {
                this.selectRandomSurvey(query.surveys.map(s => s.id));
            }
        },
        reset() {
            this.selectSurvey(this.selectedSurveyId, true);
        },
        selectRandomSurvey(surveyIds) {
            const index = Math.floor(Math.random() * surveyIds.length);
            this.selectSurvey(surveyIds[index], true);
        },
        sortResultsBy(results, sortBy) {
            let sortByFunc = null;
            if (sortBy === 'result') {
                sortByFunc = (a, b) => {
                    return Number(b.result) - Number(a.result);
                };
            }
            if (sortBy === 'shortcut') {
                sortByFunc = (a, b) => a.party.shortcut.localeCompare(b.party.shortcut);
            }

            if (!sortByFunc) {
                return -1;
            }
            results.sort((a, b) => {
                if (a.party.shortcut.toLowerCase() === sonstige) {
                    return 1;
                }
                return sortByFunc(a, b);
            })
        },
        sortSurveys(surveys) {
            surveys.sort((s1, s2) => {
                return s2.release.getTime() - s1.release.getTime()
            });
            surveys.forEach(survey => {
                this.sortResultsBy(survey.results, 'result');
            });
        },
        selectSurvey(id, force = false) {
            if (id === this.selectedSurveyId && !force) {
                return;
            }
            this.appStore.setSelectedSurveyId(id);
            const selectedSurvey = this.appStore.selectedSurvey;
            const cloned = deepCloneObject(selectedSurvey);
            this.patchCDUShortcut(cloned);
            cloned.results.forEach(r => {
                r.locked = false, r.exception = false
            });
            this.appStore.setEditingSurvey(cloned);
            this.generateCoalitions();
        },
        generateCoalitions() {
            const correctedResults = this.prepareResults(this.editingSurvey?.results);
            const coalitions = new CoalitionMap();
            this.traverseCoalitions(null, correctedResults, coalitions);
            this.appStore.setCoalitions(coalitions);
        },
        prepareResults(results) {
            const filterValidResults = (r) => r.party.shortcut.toLowerCase() !== sonstige && (r.result >= 5 || r.exception);
            const validResults = deepCloneObject(results).filter(filterValidResults);
            const validResultsSum = validResults.reduce((sum, r) => sum + r.result, 0);
            return validResults.map(r => {
                const correctedResult = (r.result / validResultsSum) * 100; //prozente hochrechnen
                return {...r, result: correctedResult};
            }).sort((r1, r2) => r2.result - r1.result);
        },
        traverseCoalitions(previousPath, nodes, coalitions) {
            this.counts += 1;
            if (!previousPath) {
                previousPath = [];
            }

            const usedNodes = [...previousPath];
            for (let node of nodes) {
                usedNodes.push(node)
                const next = [...previousPath, node];
                next.sort((r1, r2) => r2.result - r1.result);
                const sum = next.reduce((sum, pr) => sum + pr.result, 0);
                if (sum > 50) {
                    //const id = next.map(p => p.party.id).sort().join('|');
                    const nextCoalition = new Coalition(next, sum, 'id');
                    coalitions.addSafe(nextCoalition);
                    continue;
                }

                const filtered = nodes.filter(n => !usedNodes.includes(n));
                if (filtered.length > 0) {
                    this.traverseCoalitions([...next], filtered, coalitions);
                }
            }


        },
        patchCDUShortcut(survey) {
            const cduResult = survey.results.find(r => r.party.shortcut.toLowerCase().startsWith('cdu'));
            cduResult.party.shortcut = 'Union';
        },
        handleLockChange(change) {
            change.prev.locked = change.locked;
        },
        handleResultChange(change) {
            this.updateUnlockedResults(change);
            this.generateCoalitions();
        },
        handleHurdleExceptionChange(partyResult, changedState) {
            partyResult.exception = changedState;
            this.generateCoalitions();
        },
        updateUnlockedResults(changedResult) {
            const diff = changedResult.result - changedResult.prev.result;
            if (diff === 0) {
                return;
            }
            const unlockedResults = this.appStore.editingSurvey.results
                .filter(pr => !pr.locked)
                .filter(pr => pr !== changedResult.prev);

            for (let i = 0; i < Math.abs(diff); i++) {
                this.renderOneStepChange(diff, changedResult.prev, unlockedResults);
            }

            const updatedResults = [...this.appStore.editingSurvey.results.map(r => r !== changedResult ? r : deepCloneObject(changedResult.prev))];
            this.appStore.setEditingSurveyResults(updatedResults);
        },
        renderOneStepChange(diff, prevResult, unlockedResults) {
            if (diff > 0) {
                this.changeResultValue(prevResult, unlockedResults, ur => ur.result > 0, -1);
            } else if (diff < 0) {
                this.changeResultValue(prevResult, unlockedResults, ur => ur.result < 50, 1)
            }
        },
        changeResultValue(prev, unlockedResults, cond, changeValue) {
            const validResults = unlockedResults.filter(cond);
            if (validResults.length === 0) {
                return;
            }
            const randomIndex = Math.trunc(Math.random() * validResults.length);
            validResults[randomIndex].result = Number(validResults[randomIndex].result) + changeValue;
            prev.result += Math.round((-1 * changeValue));
        }
    },
    computed: {
        surveys() {
            return this.appStore.surveys;
        },
        selectedSurvey() {
            return this.appStore.selectedSurvey;
        },
        coalitions() {
            return this.appStore.coalitions;
        },
        changed() {
            const selectedSurveyOriginal = this.selectedSurvey;
            return !this.editingSurvey.results.every(clonedResult => selectedSurveyOriginal.results.find(r => r.party.id === clonedResult.party.id  && r.result === clonedResult.result))
        },
        allCoalitions() {
            const c = this.appStore.coalitions
            return c ? c.getAllCoalitions() : [];
        },
        editingSurvey() {
            return this.appStore.editingSurvey;
        },
        selectedSurveyId() {
            return this.appStore.selectedSurveyId;
        },
        optionals() {
            return this.appStore.editingSurvey
                .results ? this.appStore.editingSurvey.results
                .filter(r => r.party.shortcut.toLowerCase() !== 'sonstige')
                .filter(r => r.result < HURDLE) : [];
        }
    }
}
;
</script>

<style lang="scss" scoped>

.app-content {
  max-width: 1280px;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  padding: 10px;

  .heading {
    font-size: 25px;
    font-weight: bold;
    padding-bottom: 15px;
  }

  .subheading {
    font-size: 20px;
    font-weight: bold;
    padding-bottom: 10px;
  }

  .survey-nav {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 70%;

    .survey-items {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      max-width: 100%;


      .survey-item {
        box-sizing: border-box;
        background-color: #D7D7FE;
        width: 120px;
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 12px;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;

        &.selected {
          background-color: #B0B0FD;
        }

        &:not(.selected):hover {
          background-color: #d1d1ff;
        }

        .institute-name {
          font-weight: bold;
          overflow: hidden;
          text-overflow: ellipsis;
        }

      }
    }
  }


  @media screen and (max-width: 850px) {

    .survey-item {
      font-size: 10px !important;
      width: 90px !important;
    }

    .survey-playground-wrapper {
      flex-direction: column !important;
      justify-content: center;
      align-items: center;

      .playground, .coalition-results {
        width: 95% !important;

      }

      .party-result-panel {
        justify-content: space-between !important;
      }

      .coalition-wrapper {
        width: 47% !important;
      }
    }
  }

  .survey-playground-wrapper {
    display: flex;
    gap: 25px;
    width: 100%;
    box-sizing: border-box;

    .playground {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 40%;
      gap: 10px;
      max-width: 600px;


      .playground-footer-panel {
        display: flex;
        justify-content: space-between;
        align-self: flex-start;
        width: 100%;
        align-items: center;
      }
    }

    .coalition-results {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      gap: 10px;
      width: fill;
      min-width: 300px;

      .coalition-results-content {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        align-content: flex-start;
        justify-content: space-between;
        gap: 25px 15px;

      }
    }
  }

  .optional {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .optional-title {
      display: flex;
      font-weight: bolder;
      gap: 5px;
      align-items: center;

      .star {
        width: 15px;
      }

      img {
        width: 25px;
      }
    }

    .not-made-the-hurdle {
      display: flex;
      gap: 15px;

      .hurdle-elem {
        display: flex;
        gap: 10px;
        border: 1px solid #bbb9b7;
        border-radius: 4px;
        outline: none;
        background-color: transparent;
        white-space: nowrap;
        appearance: none;
        padding: 6px 12px;
        font-weight: bolder;
        cursor: pointer;

        img {
          width: 15px;
        }

        &:hover {
          background-color: #efefef;
        }
      }

    }
  }

}


</style>
