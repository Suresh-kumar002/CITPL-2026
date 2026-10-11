(function () {
    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function formatOvers(value) {
        const overs = Number(value);
        return Number.isFinite(overs) ? `${overs.toFixed(1)} ov` : "0.0 ov";
    }

    function renderDashboard() {
        const db = window.citplDB && window.citplDB.db;
        if (!db) return;

        const teams = Array.isArray(db.teams) ? db.teams : [];
        const players = Array.isArray(db.players) ? db.players : [];
        const matches = Array.isArray(db.matches) ? db.matches : [];
        const approvedPlayers = players.filter(player => player.status === "APPROVED");
        const liveMatch = db.liveMatch || {};
        const isMatchLive = ["LIVE", "IN_PROGRESS"].includes(String(liveMatch.status || "").toUpperCase());
        let scoreState = null;
        try {
            scoreState = JSON.parse(localStorage.getItem("CITPL_SCORE") || "null");
        } catch (error) {
            console.error("Unable to read cached CITPL live score.", error);
        }
        const scoreIsLive = !!(scoreState && scoreState.match && !scoreState.match.isComplete);
        const seasonStatus = String((db.season && db.season.status) || "REGISTRATION")
            .replaceAll("_", " ")
            .toLowerCase()
            .replace(/\b\w/g, letter => letter.toUpperCase());

        setText("dashboardSeasonStatus", seasonStatus);
        setText("dashboardSeasonStatusChip", seasonStatus);
        setText("dashboardTeamCount", String(teams.length));
        setText("dashboardPlayerCount", String(approvedPlayers.length));
        setText("dashboardMatchCount", String(matches.length));
        setText("dashboardLiveCount", isMatchLive || scoreIsLive ? "1 live" : "No live match");

        const liveContent = document.getElementById("dashboardLiveContent");
        const liveBadge = document.getElementById("dashboardLiveBadge");
        if (!liveContent) return;

        if (isMatchLive || scoreIsLive) {
            if (liveBadge) {
                liveBadge.className = "badge rounded-pill text-bg-danger";
                liveBadge.innerHTML = '<span class="live-pulse me-1"></span> LIVE NOW';
            }

            const teamA = liveMatch.teamA || {};
            const teamB = liveMatch.teamB || {};
            const score = document.createElement("div");
            score.className = "dashboard-match-score";
            score.textContent = scoreState
                ? `${Number(scoreState.innings.runs) || 0}/${Number(scoreState.innings.wickets) || 0}`
                : `${Number(teamA.runs) || 0}/${Number(teamA.wickets) || 0}`;

            const innings = document.createElement("div");
            innings.className = "dashboard-match-meta";
            if (scoreState) {
                const balls = Number(scoreState.innings.balls) || 0;
                const overs = `${Math.floor(balls / 6)}.${balls % 6} ov`;
                innings.textContent = `${scoreState.innings.battingTeam || "Batting team"} · ${overs}`;
            } else {
                innings.textContent = `${teamA.name || "Team A"} · ${formatOvers(teamA.overs)}`;
            }

            const opponent = document.createElement("div");
            opponent.className = "dashboard-team-line";
            const opponentName = document.createElement("strong");
            opponentName.textContent = scoreState
                ? `${scoreState.match.hostTeam || "Host"} vs ${scoreState.match.visitorTeam || "Visitor"}`
                : (teamB.name || "Team B");
            const opponentScore = document.createElement("span");
            opponentScore.className = "text-secondary fw-bold";
            opponentScore.textContent = scoreState
                ? (scoreState.innings.target ? `Target ${scoreState.innings.target}` : `Innings ${scoreState.innings.inningNumber || 1}`)
                : `${Number(teamB.runs) || 0}/${Number(teamB.wickets) || 0} · ${formatOvers(teamB.overs)}`;
            opponent.append(opponentName, opponentScore);

            liveContent.replaceChildren(score, innings, opponent);
        } else {
            if (liveBadge) {
                liveBadge.className = "badge rounded-pill text-bg-light text-secondary";
                liveBadge.textContent = "MATCH CENTER";
            }
            const empty = document.createElement("div");
            empty.className = "dashboard-empty";
            empty.textContent = matches.length
                ? "No match is live right now. Check the schedule for fixtures and updates."
                : "Live score updates will appear here when the league starts a match.";
            liveContent.replaceChildren(empty);
        }

        const auctionState = db.auctionState || {};
        const auctionStatus = String(auctionState.status || "NOT_STARTED").replaceAll("_", " ");
        setText("dashboardAuctionStatus", auctionStatus === "LIVE" ? "Auction is live" : `Auction ${auctionStatus.toLowerCase()}`);

        const user = window.citplDB.getCurrentUser();
        const welcome = document.getElementById("dashboardWelcome");
        if (welcome) welcome.textContent = user ? `Welcome back, ${user.name || "CITPL member"}` : "Welcome to CITPL 2026";

        const news = document.querySelector("#marqueeText");
        if (news) {
            const tickerItems = [
                `CITPL 2026 · ${seasonStatus}`,
                `${teams.length} teams`,
                `${approvedPlayers.length} approved players`,
                `${matches.length} scheduled matches`,
                isMatchLive || scoreIsLive ? "Live score is available now" : "Follow match updates and team standings"
            ];
            news.innerHTML = tickerItems.map(item => `<span>${item}</span> •`).join(" ");
        }
    }

    function init() {
        renderDashboard();
        if (window.citplDB && typeof window.citplDB.subscribe === "function") {
            window.citplDB.subscribe(renderDashboard);
        }
        window.addEventListener("storage", event => {
            if (event.key === "CITPL_SCORE" || event.key === "CITPL_DATABASE_STORE_2026") renderDashboard();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
