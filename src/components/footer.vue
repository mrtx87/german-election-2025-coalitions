<template>
    <div class="footer" v-if="!cookieAnswered && !cookiePolicy">
        <span class="footer-text">Sie müssen der Nutzung von Cookies zur Speicherung ihrer Auswahl zustimmen. Wir speichern keinerlei personenbezogene Daten. </span>
        <div class="button-panel">
            <button class="default-button" v-on:click="answer(true)">zustimmen</button>
            <button class="default-button" v-on:click="answer(false)">ablehnen</button>
        </div>
    </div>
</template>

<script>
import {useAppStateStore} from "@/stores/app-state.ts";

const COOKIE_AGREE = 'C_AGREE';

export default {
    name: "footer-vue",
    components: {},
    created() {
        this.appStore = useAppStateStore();
        this.updateCookiePolicy(Boolean(this.$cookies.get(COOKIE_AGREE)));
    },
    data: function () {
        return {
            appStore: null,
            cookieAnswered: false
        }
    },
    methods: {
        answer(agree) {
            this.cookieAnswered = true;
            this.updateCookiePolicy(agree);
        },
        updateCookiePolicy(agree) {
            if (agree) {
                this.$cookies.set(COOKIE_AGREE, Date.now());
                this.appStore.setCookiePolicy(true);
                return;
            }
            this.appStore.setCookiePolicy(false);
            this.$cookies.remove(COOKIE_AGREE);
        }
    },
    computed: {
        cookiePolicy() {
            return this.appStore?.cookiePolicy;
        }
    }
};
</script>

<style lang="scss" scoped>

.footer {
  box-sizing: border-box;
  position: fixed;
  bottom: 0;
  width: 100%;
  left: 0px;
  height: 50px;
  background-color: slategrey;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 35px;

  .button-panel {
    display: flex;
    gap: 25px;
  }

  .footer-text {
    font-weight: bold;
    color: black;
  }
}

</style>
