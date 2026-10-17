import {t} from "@amlaklink/localization";
import {usePreferences} from "../../src/context";
import {EmptyMessage,Page,ScreenHeading} from "../../src/ui";
export default function Inbox(){const {locale}=usePreferences();
 return <Page><ScreenHeading title={t(locale,"inbox")}/><EmptyMessage icon="✉" title={t(locale,"noInbox")} body={t(locale,"signInLater")}/></Page>;
}
