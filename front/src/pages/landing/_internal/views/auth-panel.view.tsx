import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/atoms/tabs";
import { Panel } from "@/shared/components/molecules/panel";
import { AUTH_TAB, type AuthTab } from "@/shared/constants/auth-tab";
import { RegisterFormContainer } from "../containers/register-form.container";
import { LoginFormContainer } from "../containers/login-form.container";

interface AuthPanelViewProps {
  defaultTab: AuthTab;
}

/** Le panneau d'accès : deux onglets, un seul formulaire visible à la fois. */
export function AuthPanelView({ defaultTab }: AuthPanelViewProps) {
  return (
    <Panel frame="ornate">
      <Tabs defaultValue={defaultTab} className="gap-0">
        <AuthTabsList />
        <TabsContent value={AUTH_TAB.signup}>
          <RegisterFormContainer />
        </TabsContent>
        <TabsContent value={AUTH_TAB.login}>
          <LoginFormContainer />
        </TabsContent>
      </Tabs>
    </Panel>
  );
}

function AuthTabsList() {
  return (
    <TabsList variant="panel">
      <TabsTrigger value={AUTH_TAB.signup}>S'inscrire</TabsTrigger>
      <TabsTrigger value={AUTH_TAB.login}>Se connecter</TabsTrigger>
    </TabsList>
  );
}
