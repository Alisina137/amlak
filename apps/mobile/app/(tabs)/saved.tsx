import {router} from "expo-router";
import {t} from "@amlaklink/localization";
import {usePreferences} from "../../src/context";
import {Action,EmptyMessage,Page,ScreenHeading} from "../../src/ui";
export default function Saved(){
 const {locale}=usePreferences();
 return <Page><ScreenHeading title={t(locale,"saved")}/><EmptyMessage icon="♡" title={t(locale,"noSaved")} body={t(locale,"signInLater")}/>
 <Action label={t(locale,"browse")} onPress={()=>router.replace("/(tabs)/search")}/></Page>;
}
