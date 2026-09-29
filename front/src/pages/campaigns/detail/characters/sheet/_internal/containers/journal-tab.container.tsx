import { useParams } from "react-router-dom";
import { useJournalTab } from "../hooks/use-journal-tab";
import { JournalTabView } from "../views/journal-tab.view";

export function JournalTabContainer() {
  const { campaignId = "", characterId = "" } = useParams();
  const journal = useJournalTab({ campaignId, characterId });

  return <JournalTabView journal={journal} />;
}
