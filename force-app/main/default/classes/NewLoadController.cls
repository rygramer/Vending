public with sharing class NewLoadController {
    @AuraEnabled(cacheable=true)
    public static List<LoadProduct> getProducts(Id locationId){
        List<LoadProduct> loadProducts = new List<LoadProduct>();
        for(LocationProduct__c locationProduct : [SELECT Id, Name, UnitPrice__c FROM LocationProduct__c WHERE Location__c = :locationId ORDER BY UnitPrice__c]){
            LoadProduct loadProduct = new LoadProduct();
            loadProduct.rowId = locationProduct.Id;
            loadProduct.rowName = locationProduct.Name;
            loadProduct.unitPrice = locationProduct.UnitPrice__c;
            loadProduct.quantity = 0;

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
                Product__c = productFromLWC.rowId,
                Quantity__c = productFromLWC.quantity
            );
            loadProducts.add(loadProduct);
        }
        insert loadProducts;
    }

    @AuraEnabled(cacheable=true)
    public static List<Load> getLoads(Id vendorId){
        List<Load> loads = new List<Load>();
        for(Load__c load : [SELECT Id, Name, CreatedDate, Value__c, (SELECT Id, Product__r.Name, Quantity__c, UnitPrice__c, Value__c FROM LoadProducts__r) FROM Load__c WHERE Vendor__c = :vendorId ORDER BY CreatedDate DESC]){
            Load l = new Load(load.Id, load.CreatedDate.format('h:mm:ss a'), load.Value__c);

            for(LoadProduct__c product : load.LoadProducts__r){
                LoadProduct lp = new LoadProduct();
                lp.rowId = product.Id;
                lp.rowName = product.Product__r.Name;
                lp.quantity = product.Quantity__c;
                lp.unitPrice = product.UnitPrice__c;
                lp.value = product.Value__c;

                l.loadProducts.add(lp);
            }

            loads.add(l);
        }
        return loads;
    }

    public class Load{
        @AuraEnabled
        public Id rowId;

        @AuraEnabled
        public String rowName;

        @AuraEnabled
        public Decimal value;

        @AuraEnabled
        public List<LoadProduct> loadProducts;

        public Load(Id loadId, String createdDate, Decimal value){
            this.rowId = loadId;
            this.rowName = createdDate;
            this.value = value;
            this.loadProducts = new List<LoadProduct>();
        }
    }

    public class LoadProduct{
        @AuraEnabled
        public Id rowId;

        @AuraEnabled
        public String rowName;

        @AuraEnabled
        public Decimal unitPrice;

        @AuraEnabled
        public Decimal quantity;

        @AuraEnabled
        public Decimal value;
    }

}
