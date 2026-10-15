// Authentifizierungs-Middleware
// Aufgaben:
// - JWT prüfen
// - Benutzer identifizieren
// - Rollenbasierte Zugriffe steuern
const jwt = require('jsonwebtoken');
// Prüft das JWT-Token
// Falls ungültig:
// -> Zugriff verweigern
// Falls gültig:
// -> Benutzerinformationen laden
function verifyToken(req, res, next) {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({
            message: 'Kein Token vorhanden'
        });
    }

    const token =
        authHeader.split(' ')[1];

    try {

        req.user = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        next();

    } catch (error) {

        return res.status(401).json({
            message: 'Ungültiger Token'
        });
    }
}
// Prüft Administratorrechte
// Nur Benutzer mit Rolle "admin"
// erhalten Zugriff
function verifyAdmin(req, res, next) {

    if (req.user.role !== 'admin') {

        return res.status(403).json({
            message: 'Adminzugriff erforderlich'
        });
    }

    next();
}
// Prüft Projektleiterrechte
// Zugriff für:
// - Projektleiter
// - Administrator
function verifyProjektleiter(req, res, next) {

    if (
        req.user.role !== 'projektleiter'
        &&
        req.user.role !== 'admin'
    ) {

        return res.status(403).json({
            message:
                'Projektleiterzugriff erforderlich'
        });
    }

    next();
}

module.exports = {
    verifyToken,
    verifyAdmin,
    verifyProjektleiter
};