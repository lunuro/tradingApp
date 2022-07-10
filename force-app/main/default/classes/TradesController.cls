/**
 * @description       : Class used as LWC Booked Trades controller
 * @author            : lunuro
 * @group             : lunuro
 * @last modified on  : 11-06-2022
 * @last modified by  : lunuro 
 * Modifications Log
 * Ver   Date         Author     Modification
 * 1.0   11-06-2022   lunuro   Initial Version
**/
public with sharing class TradesController {
    @TestVisible static List<String> listColumns {get; set;}
    /**
    * @description Get list of trade records to be shown 
    * @author lunuro | 11-06-2022 
    * @return List<Trade__c> 
    **/
    @AuraEnabled(cacheable=true)
    public static List<Trade__c> getTradesList() {
        listColumns = System.Label.BookedTradesColumns.split(',');
        List<String> listTradeFields = new List<String>(
            Schema.SObjectType.Trade__c.fields.getMap().keySet()
        );
        String fields = '';
        for(String stCol : listColumns){
            if(listTradeFields.contains(stCol.toLowerCase()) == true){
                fields += stCol + ',';
            }
        }
        fields = fields.removeEnd(',');
        String query = 'SELECT ' + fields + ' FROM Trade__c WITH SECURITY_ENFORCED ORDER BY CreatedDate DESC';
        return Database.query(String.escapeSingleQuotes(query));
    }
}