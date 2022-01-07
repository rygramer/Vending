public with sharing class NewLoadController {
    @AuraEnabled(cacheable=true)
    public static List<LoadProduct> getProducts(Id locationId){
        List<LoadProduct> loadProducts = new List<LoadProduct>();
        for(LocationProduct__c locationProduct : [SELECT Id, Name, UnitPrice__c FROM LocationProduct__c WHERE Location__c = :locationId ORDER BY UnitPrice__c]){
            LoadProduct loadProduct = new LoadProduct(
                locationProduct.Id,
                locationProduct.Name,
                locationProduct.UnitPrice__c,
                0
            );
            loadProducts.add(loadProduct);
        }
        return loadProducts;
    }

    @AuraEnabled
    public static void createLoadProduct(string productsFromLwc, Id vendorId){
        Load__c load = new Load__c(Vendor__c = vendorId);
        insert load;

        List<LoadProduct__c> loadProducts = new List<LoadProduct__c>();
        for(LoadProduct productFromLWC : (List<LoadProduct>)JSON.deserialize(productsFromLWC, List<LoadProduct>.class)){
            LoadProduct__c loadProduct = new LoadProduct__c(
                Load__c = load.Id,
                Product__c = productFromLWC.productId,
                Quantity__c = productFromLWC.quantity
            );
            loadProducts.add(loadProduct);
        }
        insert loadProducts;
    }

    @AuraEnabled(cacheable=true)
    public static List<Load__c> getLoads(Id vendorId){
        return [SELECT Id, Name, CreatedDate, Value__c FROM Load__c WHERE Vendor__c = :vendorId ORDER BY CreatedDate DESC];
    }

    public class LoadProduct{
        @AuraEnabled
        public Id productId;

        @AuraEnabled
        public String name;

        @AuraEnabled
        public Decimal unitPrice;

        @AuraEnabled
        public Integer quantity;

        public LoadProduct(){}

        public LoadProduct(Id productId, String name, Decimal unitPrice, Integer quantity){
            this.productId = productId;
            this.name = name;
            this.unitPrice = unitPrice;
            this.quantity = quantity;
        }
    }

}
