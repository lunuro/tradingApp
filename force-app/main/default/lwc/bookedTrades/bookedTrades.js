import { LightningElement, wire } from 'lwc';

//Method used to show toast
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//Method used to get field metadata definition
import { getObjectInfo } from "lightning/uiObjectInfoApi";

//Method used to refresh data from apex
import { refreshApex } from '@salesforce/apex';
//Apex class to get trade records
import getTradesList from '@salesforce/apex/TradesController.getTradesList';

//Import labels
import bookedTradesTitle from '@salesforce/label/c.BookedTradesTitle';
import newTradeTitle from '@salesforce/label/c.NewTradeTitle';
import BookedTradesErrorCols from '@salesforce/label/c.BookedTradesErrorCols';
import BookedTradesErrorTrades from '@salesforce/label/c.BookedTradesErrorTrades';

//Import Trade schema definition
import TRADE_OBJECT from '@salesforce/schema/Trade__c';

//Import trade colums from custom label
import tradeColumns from '@salesforce/label/c.BookedTradesColumns';

/**
 * @description JS bookedTrades LWC controller class
 * @author lunuro
 * @date 11/06/2022
 * @export
 * @class BookedTrades
 * @extends {LightningElement}
 */
export default class BookedTrades extends LightningElement {
    columns;
    sortedField = 'CreatedDate';
    newClicked = false;
    dataList;
    dataTrades;
    wiredTrades;
    //Generate column list from custom label
    fieldCols = tradeColumns.split(",");
    label = {
        bookedTradesTitle,
        newTradeTitle,
        BookedTradesErrorCols,
        BookedTradesErrorTrades
    };
    /**
     * @description Method to get dynamically columns to be shown in datatable
     * @author lunuro
     * @date 11/06/2022
     * @param {*} { error, data }
     * @memberof BookedTrades
     */
    @wire(getObjectInfo, { objectApiName: TRADE_OBJECT })
    columnsNames({ error, data }) {
        if (data) {
            var cols = [];
            this.fieldCols.forEach(col => {
                //Avoid adding column if it's not in object definition
                if (!data.fields[col]) return;
                //Generate columns from trade object fields definition
                let field = {};
                field['label'] = data.fields[col].label;
                field['fieldName'] = col;
                field['cellAttributes'] = {};
                field['cellAttributes']['alignment'] = 'left';
                //Generate type and attributes depending on field data type
                switch (data.fields[col].dataType) {
                    case 'Date':
                    case 'DateTime':
                        field['type'] = 'date';
                        field['typeAttributes'] = {};
                        field['typeAttributes']['year'] = 'numeric';
                        field['typeAttributes']['month'] = '2-digit';
                        field['typeAttributes']['day'] = '2-digit';
                        field['typeAttributes']['hour'] = '2-digit';
                        field['typeAttributes']['minute'] = '2-digit';
                        field['typeAttributes']['hour12'] = false;
                        break;
                    case 'Double':
                    case 'Int':
                        field['type'] = 'number';
                        field['typeAttributes'] = {};
                        field['typeAttributes']['minimumFractionDigits'] = 2;
                        field['typeAttributes']['maximumFractionDigits'] = 2;
                        break;
                    default:
                        field['type'] = 'text';
                        break;
                };
                //Set 4 decimals in Rate column
                if (field['fieldName'] === 'Rate__c') {
                    field['typeAttributes']['minimumFractionDigits'] = 4;
                    field['typeAttributes']['maximumFractionDigits'] = 4;
                }
                cols.push(field);
            })
            this.columns = cols;
        } else if (error) {
            this.generateToast(this.label.BookedTradesErrorCols, error.body.message, 'error');
        }
    }
    /**
     * @description Method to get trade records from Apex
     * @author lunuro
     * @date 11/06/2022
     * @param {*} result
     * @memberof BookedTrades
     */
    @wire(getTradesList)
    trades(result) {
        //Variable used to refresh
        this.wiredTrades = result;
        if (result.data) {
            this.dataTrades = result.data;
        } else if (result.error) {
            this.generateToast(this.label.BookedTradesErrorTrades, result.error.body.message, 'error');
            this.dataList = undefined;
        }
    }
    /**
     * @description Method to handle New Trade button to open LWC newTrade
     * @author lunuro
     * @date 11/06/2022
     * @memberof BookedTrades
     */
    handleClick() {
        this.newClicked = true;
    }

    /**
     * @description Method to handle LWC newTrade closing
     * @author lunuro
     * @date 11/06/2022
     * @memberof BookedTrades
     */
    handleCloseNewTrade() {
        //Refresh data after modal closing
        refreshApex(this.wiredTrades);
        this.newClicked = false;
    }

    /**
     * @description Method to display a toast
     * @author lunuro
     * @date 11/06/2022
     * @param {*} title
     * @param {*} message
     * @param {*} variant
     * @memberof BookedTrades
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