import {defineStore} from 'pinia';

export const useAppStateStore = defineStore('AppStore', {
    state: () => {
        return {
            _surveys: [],
            _selectedSurveyId: '',
            _editingSurvey: {},
            _coalitions: null
        }
    },
    actions: {
        setSurveys(surveys) {
            this._surveys = surveys;
        },
        setSelectedSurveyId(id) {
            this._selectedSurveyId = id;
        },
        setEditingSurvey(survey) {
            this._editingSurvey = survey;
        },
        setEditingSurveyResults(results) {
            this._editingSurvey.results = results;
        },
        setCoalitions(coalitions) {
            this._coalitions = coalitions;
        }
    },
    getters: {
        surveys: (state) => state._surveys,
        selectedSurveyId: (state) => state._selectedSurveyId,
        selectedSurvey: (state) => state._surveys.find(s => s.id === state._selectedSurveyId),
        editingSurvey: (state) => state._editingSurvey,
        coalitions: (state) => state._coalitions
    }
});