import {useLocalSearchParams} from "expo-router";
import {BillingScreen} from "../src/billing-ui";
export default function Upgrade(){
 const {listingId}=useLocalSearchParams<{listingId?:string}>();
 return <BillingScreen listingId={listingId}/>;
}
