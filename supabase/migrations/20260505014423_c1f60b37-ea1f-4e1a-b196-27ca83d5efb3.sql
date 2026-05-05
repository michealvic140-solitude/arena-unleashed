
INSERT INTO public.user_roles (user_id, role)
VALUES ('c71599d2-3093-4809-8cdf-d07d1bbcf75f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.terms_sections (category, title, body, sort_order) VALUES
('Account', 'Account Creation & Management', 'You must provide accurate information during registration including your in-game name, country, and gang/faction. One account per person. Sharing accounts is forbidden and will lead to a permanent ban.', 1),
('Account', 'Login & Security', 'Keep your password private. We track login activity, IP, and device. Suspicious login patterns will trigger a security review and may temporarily restrict your account.', 2),
('Betting', 'Placing Bets', 'All bets must be placed BEFORE a match starts. Once a match begins your ticket is locked. Identical open tickets are not allowed. The house decision on disputes is final.', 3),
('Betting', 'Maximum Payout', 'Regardless of stake or odds, the maximum payout per ticket is capped at 60,000,000 tokens. Stake limits: minimum 2,000,000 — maximum 20,000,000.', 4),
('Betting', 'No Refund Policy', 'Once a match has started no stake is refundable for any reason. Cashout is the only way to recover part of your stake while a ticket is still open.', 5),
('Tokens', 'Token Requests', 'Token top-up requests require valid proof of payment. False proof results in a permanent ban and forfeiture of balance.', 6),
('Tokens', 'Promo Codes', 'Promo codes are single-use per account and may expire. Abuse of promo codes (multi-accounting, sharing) will void all related balances.', 7),
('Chat', 'Texting Conduct', 'No hate speech, no doxxing, no spam. Moderators may mute or ban repeat offenders. All chat is logged.', 8),
('Security', 'Suspicious Activity', 'Bot use, exploits, payment fraud, and chargebacks all result in immediate ban. Account activity is tracked for fraud detection.', 9),
('General', 'Acceptance', 'By creating an account you accept all terms above and any updates published in this section. Continued use after updates means you accept the new terms.', 10)
ON CONFLICT DO NOTHING;
