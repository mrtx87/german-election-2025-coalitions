<template>
    <div class="select-party-value">
        <div class="party-meta"
             :title="partyResult?.party.name + ': ' + partyResult?.result + '%' + (partyResult.result < 5 ?  (' -> ' + (partyResult.exception ?  text : 'Nicht im Bundestag')) : '')">
            <div class="hurdle-indicator">
                <img src="@/assets/checked.svg" v-if="!isSonstige(partyResult) && partyResult.result >= 5">
                <img src="@/assets/unchecked.svg"
                     v-if="isSonstige(partyResult) || (partyResult.result < 5 && !partyResult.exception)">
                <img src="@/assets/star.svg"
                     v-if="!isSonstige(partyResult) && (partyResult.result < 5 && partyResult.exception)">
            </div>
            <span class="party-meta-name">{{ partyResult?.party.shortcut }}:</span>
            <span class="party-meta-value">{{ partyResult?.result }}%</span>
        </div>
        <div class="party-result-panel">

            <div class="range">
                <input type="range" min="0" max="50" step="0.5"
                       :disabled="partyResult.locked"
                       :class="[partyResult.party.shortcut.toLowerCase().replace(/ /g, '')]"
                       :value="partyResult.result"
                       @input="updateResultState"/>
            </div>
            <button class="lock" v-on:click="updateLockState(!partyResult.locked)">
                <img src="@/assets/lock_open.svg" :style="{display: displayLockType(!partyResult.locked)}">
                <img src="@/assets/lock_closed.svg" :style="{display: displayLockType(partyResult.locked)}">
            </button>
        </div>

    </div>
</template>

<script>
import {useAppStateStore} from "@/stores/app-state.ts";
import {sonstige} from "@/services/util.ts";

export default {
    name: "select-party-value",
    components: {},
    emits: ['onLockChange', 'onResultChange'],
    props: ['partyResult'],
    created() {
        this.appStore = useAppStateStore();
    },
    watch: {
        partyResult(next, prev) {
            console.log(next, prev)
        }
    },
    data: function () {
        return {
            appStore: null,
            text: 'Zieht über die Grundmandatsklausel ein\n'
        }
    },
    methods: {
        displayLockType(visible) {
            return visible ? 'unset' : 'none'
        },
        updateLockState(state) {
            this.$emit('onLockChange', {prev: this.partyResult, locked: state})
        },
        updateResultState(event) {
            this.$emit('onResultChange', {prev: this.partyResult, result: Number(event.target.value)});
            event.target.value = this.partyResult.result;
        },
        isSonstige(partyResult) {
            return partyResult.party.shortcut.toLowerCase() === sonstige;
        }
    },
    computed: {}
};
</script>

<style lang="scss" scoped>

.select-party-value {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 3px;

  .party-meta {
    display: flex;
    gap: 5px;
    align-items: center;
    font-size: 14px;

    .hurdle-indicator {
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 15px;
      }
    }

    .party-meta-name {
      font-weight: bolder;
    }

    .party-meta-value {

    }

  }
}


input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  cursor: pointer;
  outline: none;
  overflow: hidden;
  border-radius: 16px;
}

input[type="range"]::-webkit-slider-runnable-track {
  height: 20px;
  background: #efefef;
  border-radius: 16px;
}

input[type="range"]::-moz-range-track {
  height: 20px;
  background: #efefef;
  border-radius: 16px;
}

input[type="range"]::-webkit-slider-thumb {
  /* removing default appearance */
  -webkit-appearance: none;
  appearance: none;
  /* creating a custom design */
  height: 20px;
  width: 20px;
  background-color: #fff;
  border-radius: 50%;
  border: 1px solid darkgrey;
  /*  slider progress trick  */
  box-shadow: -407px 0 0 400px darkgrey;
}

.spd[type="range"]::-webkit-slider-thumb {
  box-shadow: -407px 0 0 400px var(--spdColor) !important;
  border: 2px solid var(--spdColor) !important;
}

.union[type="range"]::-webkit-slider-thumb {
  box-shadow: -407px 0 0 400px var(--unionColor) !important;
  border: 2px solid var(--unionColor) !important;
}

.afd[type="range"]::-webkit-slider-thumb {
  box-shadow: -407px 0 0 400px var(--afdColor) !important;
  border: 2px solid var(--afdColor) !important;
}

.fdp[type="range"]::-webkit-slider-thumb {
  box-shadow: -407px 0 0 400px var(--fdpColor) !important;
  border: 2px solid var(--fdpColor) !important;
}

.grüne[type="range"]::-webkit-slider-thumb {
  box-shadow: -407px 0 0 400px var(--grüneColor) !important;
  border: 2px solid var(--grüneColor) !important;
}

.bsw[type="range"]::-webkit-slider-thumb {
  box-shadow: -407px 0 0 400px var(--bswColor) !important;
  border: 2px solid var(--bswColor) !important;
}

.bsw[type="range"]::-webkit-slider-thumb {
  box-shadow: -407px 0 0 400px var(--bswColor) !important;
  border: 2px solid var(--bswColor) !important;
}

.linke[type="range"]::-webkit-slider-thumb {
  box-shadow: -407px 0 0 400px var(--linkeColor) !important;
  border: 2px solid var(--linkeColor) !important;
}

.sonstige[type="range"]::-webkit-slider-thumb {
  box-shadow: -407px 0 0 400px var(--sonstigeColor) !important;
  border: 2px solid var(--sonstigeColor) !important;
}

.freiewähler[type="range"]::-webkit-slider-thumb {
  box-shadow: -407px 0 0 400px var(--freiewählerColor) !important;
  border: 2px solid var(--freiewählerColor) !important;
}


input[type="range"]::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  border: 1px solid darkgrey;
  box-shadow: -407px 0 0 400px #e4a320;
}

.range {
  display: flex;
  align-items: center;
  max-width: 500px;
  width: 80%;
  position: relative;
}

.party-result-panel {
  display: flex;
  justify-content: space-between !important;
  position: relative;

  .lock {
    appearance: none;
    border: none;
    background-color: transparent;
    cursor: pointer;

    img {
      width: 25px;
    }
  }
}


</style>
