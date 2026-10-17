import {t} from "@amlaklink/localization";
import {usePreferences} from "../../src/context";
import {LanguagePicker,Label,Page,ScreenHeading,SectionCard} from "../../src/ui";
export default function Account(){const {locale}=usePreferences();
 return <Page><ScreenHeading title={t(locale,"account")} subtitle={t(locale,"guest")}/>
 <SectionCard><Label weight="bold">{t(locale,"changeLanguage")}</Label><LanguagePicker/></SectionCard>
 <SectionCard><Label weight="bold">{t(locale,"myProperties")}</Label><Label muted>{t(locale,"phaseNotice")}</Label></SectionCard>
 <SectionCard><Label weight="bold">{t(locale,"privacy")}</Label><Label muted>{t(locale,"country")} · {t(locale,"noAccess")}</Label></SectionCard>
 </Page>;
}
