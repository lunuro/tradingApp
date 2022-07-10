import { LightningElement } from 'lwc';

//Method used to create a new record
import { createRecord } from 'lightning/uiRecordApi';
//Method used to apply styles from static resource
import { loadStyle } from 'lightning/platformResourceLoader';
//Method used to show toast
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

//Import CSS static resource style
import customStyle from "@salesforce/resourceUrl/newTradeStyle";

//Import labels
import fixerEndpoint from '@salesforce/label/c.fixerEndpoint';
import fixerApiKey from '@salesforce/label/c.fixerApiKey';
import errorAmount from '@salesforce/label/c.NewTradeErrorAmount';
import errorCurrency from '@salesforce/label/c.NewTradeErrorCurrency';
import newTradeTitle from '@salesforce/label/c.NewTradeTitle';
import NewTradeSuccess from '@salesforce/label/c.NewTradeSuccess';
import NewTradeSuccessMess from '@salesforce/label/c.NewTradeSuccessMessage';
import NewTradeErrorRate from '@salesforce/label/c.NewTradeErrorRate';
import NewTradeErrorCreate from '@salesforce/label/c.NewTradeErrorCreate';
import NewTradeCreate from '@salesforce/label/c.NewTradeCreate';
import NewTradeCancel from '@salesforce/label/c.NewTradeCancel';

//Schema imports
import TRADE_OBJECT from '@salesforce/schema/Trade__c';
import SELLCCY_FIELD from '@salesforce/schema/Trade__c.SellCurrency__c';
import RATE_FIELD from '@salesforce/schema/Trade__c.Rate__c';
import BUYCCY_FIELD from '@salesforce/schema/Trade__c.BuyCurrency__c';
import SELLAMT_FIELD from '@salesforce/schema/Trade__c.SellAmount__c';
import BUYAMT_FIELD from '@salesforce/schema/Trade__c.BuyAmount__c';

/**
 * @description JS newTrade LWC controller class
 * @author lunuro
 * @date 11/06/2022
 * @export
 * @class NewTrade
 * @extends {LightningElement}
 */
export default class NewTrade extends LightningElement {
    objectApiName = TRADE_OBJECT;
    fieldNames = { SELLCCY_FIELD, RATE_FIELD, BUYCCY_FIELD, SELLAMT_FIELD, BUYAMT_FIELD };
    sellAmount = 0;
    sellCurrency = 'EUR';
    buyCurrency = 'USD';
    buyAmount = 0;
    rate;
    disableCreate = true;
    label = {
        errorAmount,
        errorCurrency,
        newTradeTitle,
        NewTradeSuccess,
        NewTradeSuccessMess,
        NewTradeErrorRate,
        NewTradeErrorCreate,
        NewTradeCreate,
        NewTradeCancel
    };

    constructor() {
        super();
        //Apply stiles from static resource to avoid Shadow DOM
        loadStyle(this, customStyle);
        this.getRate();
    }

    /**
     * @description Method to handle changes in Sell Currency input
     * @author lunuro
     * @date 11/06/2022
     * @param {*} event
     * @memberof NewTrade
     */
    handleChangeSelCur(event) {
        this.sellCurrency = event.target.value;
        this.getRate();
        this.handleErrorCurrency();
    }

    /**
     * Method to handle changes in Sell Currency input
     * @param {*} event
     * @memberof NewTrade
     */
    handleChangeBuyCur(event) {
        this.buyCurrency = event.target.value;
        this.getRate();
        this.handleErrorCurrency();
    }

    /**
     * @description Method to handle errors in currency input fields
     * @author lunuro
     * @date 11/06/2022
     * @memberof NewTrade
     */
    handleErrorCurrency() {
        //Show an error in case the currencies are the same
        if (this.sellCurrency === this.buyCurrency) {
            //Modify inputs to add error SLDS class
            let inpCurList = this.template.querySelectorAll(".inpCurrency");
            inpCurList.forEach(inpCur => {
                inpCur.classList.add('slds-has-error');
            });
            //Show error text
            this.errorSameCurrency = true;
        } else {
            // Hide error text and remove error SLDS class
            this.errorSameCurrency = false;
            let inpCurList = this.template.querySelectorAll(".inpCurrency");
            inpCurList.forEach(inpCur => {
                if (inpCur.classList.contains('slds-has-error'))
                    inpCur.classList.remove('slds-has-error');
            });
        }
        //Control create button status
        if (!this.sellCurrency || !this.buyCurrency || this.sellCurrency === this.buyCurrency) {
            this.disableCreate = true;
        } else {
            this.disableCreate = false;
        }
    }

    /**
     * @description Method to calculate rate with data obtained from external endpoint
     * @author lunuro
     * @date 11/06/2022
     * @return {*}  
     * @memberof NewTrade
     */
    getRate() {
        //Avoid calculations and API call if the input data is not correct
        if (!this.sellCurrency || !this.buyCurrency || this.sellCurrency === this.buyCurrency) {
            this.rate = 1;
            return;
        }
        //Generate request data
        var requestOptions = {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'apikey': fixerApiKey
            }
        };
        var endpoint = fixerEndpoint;
        endpoint = endpoint.replace('{symbols}', this.buyCurrency);
        endpoint = endpoint.replace('{base}', this.sellCurrency);
        //Obtain currency rate data from external endpoint
        fetch(endpoint, requestOptions)
            .then(response => response.json())
            .then(result => {
                if (result && result.rates && result.rates[this.buyCurrency]) {
                    this.rate = this.roundDecimals(result.rates[this.buyCurrency], 4);
                    if (this.sellAmount && this.rate) {
                        this.buyAmount = this.roundDecimals(this.sellAmount * this.rate, 2);
                    }
                } else {
                    this.generateToast(this.label.NewTradeErrorRate, result.message, 'error');
                }
            })
            .catch(error => {
                this.generateToast(this.label.NewTradeErrorRate, error.body.message, 'error');
            });
    }

    /**
     * @description Method to handle changes in Sell Amount input
     * @author lunuro
     * @date 11/06/2022
     * @param {*} event
     * @memberof NewTrade
     */
    handleChangeSellAmount(event) {
        this.sellAmount = event.target.value;
        //Show an error text and set SLDS error clas if amount is not higher than 0
        if (this.sellAmount <= 0) {
            let inpSellAmount = this.template.querySelector(".inpSellAmount");
            inpSellAmount.classList.add('slds-has-error');
            this.errorAmount = true;
        } else {
            //Hide error and SLDS error class
            this.errorAmount = false;
            let inpSellAmount = this.template.querySelector(".inpSellAmount");
            if (inpSellAmount.classList.contains('slds-has-error'))
                inpSellAmount.classList.remove('slds-has-error');
        }
        //Calculate Buy Amount and handle create button status
        if (this.sellAmount && this.sellAmount > 0 && this.rate) {
            this.disableCreate = false;
            this.buyAmount = this.roundDecimals(this.sellAmount * this.rate, 2);
        } else {
            this.disableCreate = true;
        }
    }
    /**
     * @description Method to handle create button submit action
     * @author lunuro
     * @date 11/06/2022
     * @return {*}  
     * @memberof NewTrade
     */
    handleCreate() {
        //Avoid creating record if input data is not correct
        if (!this.sellCurrency || !this.buyCurrency || this.sellAmount <= 0 || (this.sellCurrency == this.buyCurrency)) {
            return;
        }
        //Generate record with corresponding field date
        const fields = {};
        fields[SELLCCY_FIELD.fieldApiName] = this.sellCurrency;
        fields[RATE_FIELD.fieldApiName] = this.rate;
        fields[BUYCCY_FIELD.fieldApiName] = this.buyCurrency;
        fields[SELLAMT_FIELD.fieldApiName] = this.sellAmount;
        fields[BUYAMT_FIELD.fieldApiName] = this.buyAmount;
        const recordInput = { apiName: TRADE_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then(() => {
                //Show success toast
                this.generateToast(this.label.NewTradeSuccess, this.label.NewTradeSuccessMess, 'success');
                //Notify parent LWC to close the modal
                this.dispatchEvent(new CustomEvent('closenew'));
            })
            .catch(error => {
                this.generateToast(this.label.NewTradeErrorCreate, error.body.message, 'error');
            });
    }
    /**
     * @description Method to handle cancel button push action
     * @author lunuro
     * @date 11/06/2022
     * @memberof NewTrade
     */
    handleCancel() {
        //Reset input values
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        //Notify parent LWC to close the modal
        this.dispatchEvent(new CustomEvent('closenew'));
    }
    /**
     * @description Method to handle decimal rounding to the one defined at field level
     * @author lunuro
     * @date 11/06/2022
     * @param {*} num
     * @param {*} decimals
     * @return {*}  
     * @memberof NewTrade
     */
    roundDecimals(num, decimals) {
        let factor = Math.pow(10, decimals);
        return Math.round((num + Number.EPSILON) * factor) / factor;
    }

    /**
     * @description Method to display a toast
     * @author lunuro
     * @date 11/06/2022
     * @param {*} title
     * @param {*} message
     * @param {*} variant
     * @memberof NewTrade
     */
    generateToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            }),
        );
    }
}