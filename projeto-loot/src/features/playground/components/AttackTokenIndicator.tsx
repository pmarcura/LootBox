"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Swords, Shield } from "lucide-react";

type AttackTokenIndicatorProps = {
  attackToken: "player1" | "player2";
  myRole: "player1" | "player2";
};

/** Indicador visual entre os boards: espada = pode atacar, escudo = defende. */
export function AttackTokenIndicator({ attackToken, myRole }: AttackTokenIndicatorProps) {
  const iHaveToken = attackToken === myRole;

  return (
    <motion.div
      className="flex justify-center py-2"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2 transition-colors ${
          iHaveToken
            ? "border-amber-500/60 bg-amber-500/15 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
            : "border-violet-500/40 bg-violet-500/10"
        }`}
      >
        {iHaveToken ? (
          <>
            <Swords size={20} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Você pode atacar
            </span>
          </>
        ) : (
          <>
            <Shield size={20} className="text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Modo defesa
            </span>
          </>
        )}
      </div>
    </motion.div>
  );
}
