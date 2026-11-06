"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import AgentAvatar from "./AgentAvatar";
import VoraAssistant from "./VoraAssistant";
import { useVoraLanguage } from "./VoraLanguage";
import s from "./Vora.module.css";
export default function ProfileAssistant() {
  const [open, setOpen] = useState(false); const { t } = useVoraLanguage();
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button className={s.agentLauncher} aria-label={t("VORAcard fragen", "Ask VORAcard")} title={t("VORAcard fragen", "Ask VORAcard")}><AgentAvatar animated/></button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className={s.chatOverlay}/><Dialog.Content className={s.chatDrawer} aria-describedby="profile-assistant-description"><Dialog.Title className={s.srOnly}>{t("VORAcard fragen", "Ask VORAcard")}</Dialog.Title><Dialog.Description id="profile-assistant-description" className={s.srOnly}>{t("Temporärer Chat zu Vorsorge und Dokumenten. Deine Falldaten werden nicht automatisch mitgesendet.", "Temporary chat about care preparation and documents. Your case data is not automatically attached.")}</Dialog.Description><VoraAssistant area="overview" onClose={() => setOpen(false)}/></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
