<template>
    <div class="coalition-wrapper" :title="titleString">
        <span class="coal-title">{{ titleString }}</span>
        <div class="party-diagram">
            <div class="half-indicator">| <span class="half-indicator-title">50%</span></div>
            <div class="party-value-line"
                 v-for="partyResult in coalitionData.partys" v-bind:key="partyResult.id"
                 :style="{width: partyResult.result + '%', backgroundColor:getColor(partyResult.party.shortcut)}"></div>
        </div>
    </div>
</template>

<script>
import {useAppStateStore} from "@/stores/app-state.ts";
import {getColor} from "@/services/util.ts";

export default {
    name: "coalition-diagram",
    components: {},
    props: ['coalitionData'],
    created() {
        this.appStore = useAppStateStore();
    },
    data: function () {
        return {
            appStore: null,
        }
    },
    methods: {
        getColor(id) {
            return getColor(id);
        }
    },
    computed: {
        titleString() {
            return this.coalitionData.partys.map(p => p.party.shortcut).join(', ') + ' - ' + this.coalitionData.sum.toFixed(2) + '%'
        }
    }
};
</script>

<style lang="scss" scoped>

.coalition-wrapper {
  width: 30%;
  display: flex;
  flex-direction: column;
  min-height: 10px;
  position: relative;
  gap: 5px;
  max-width: 250px;
  justify-content: space-between;

  .coal-title {
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;

  }

  .party-diagram {
    display: flex;
    background-color: lightgrey;
    position: relative;

    .half-indicator {
      position: absolute;
      left: calc(50% - 1px);
      top: -6px;

      .half-indicator-title {
        position: absolute;
        top: 18px;
        left: -5px;
        font-size: 11px;
        font-weight: bold;
      }

    }

    .party-value-line {
      height: 8px;
    }
  }

}


</style>
