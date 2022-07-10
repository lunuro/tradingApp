/**
 * @description       : Class to test the Booked trades LWC controller
 * @author            : lunuro
 * @group             : lunuro
 * @last modified on  : 11-06-2022
 * @last modified by  : lunuro
 * Modifications Log
 * Ver   Date         Author     Modification
 * 1.0   11-06-2022   lunuro   Initial Version
**/
@isTest
public with sharing class TradesControllerTest {

    /**
    * @description Method to create trade records test data
    * @author SGT Team | 11-06-2022
    **/
    @TestSetup
    static void createTradesData(){
        Trade__c tr = new Trade__c();
        tr.Rate__c = 1.1010;
        tr.SellAmount__c = 100;
        tr.SellCurrency__c = 'USD';
        tr.BuyCurrency__c = 'EUR';
        tr.BuyAmount__c = tr.SellAmount__c * tr.Rate__c;
        insert tr;
    }
    /**
    * @description Method to test get trade records meth
    * @author SGT Team | 11-06-2022
    **/
    @IsTest
    static void testgetTradesList(){
        //List of columns to be used to retrieve
        List<String> listCols = System.Label.BookedTradesColumns.split(',');
        //Add fake column to test method
        listCols.add('testNot');

        Test.startTest();

        TradesController.listColumns = listCols;
        List<Trade__c> listTrResult = TradesController.getTradesList();

        Test.stopTest();

        //Expected result
        List<Trade__c> listTrade = [SELECT SellCurrency__c, SellAmount__c, BuyCurrency__c, BuyAmount__c, Rate__c, CreatedDate FROM Trade__c ORDER BY CreatedDate DESC ];

        //Check fields retrieved except fake column
        for(String stCol : listCols){
            if(stCol == 'testNot'){
                continue;
            }
            System.assertEquals(listTrade[0].get(stCol),listTrResult[0].get(stCol), 'Assert error Trade' + stCol);
        }
    }
}