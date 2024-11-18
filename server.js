const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

function solveTSP(dist) {
    try {
        const n = dist.length;
        if (n === 0) throw new Error('Empty distance matrix');
        
        const VISITED_ALL = (1 << n) - 1;
        
        // Initialize DP array with more reasonable initial values
        const dp = Array(1 << n).fill().map(() => Array(n).fill(Number.MAX_SAFE_INTEGER));
        const parent = Array(1 << n).fill().map(() => Array(n).fill(-1));
        
        // Base case
        dp[1][0] = 0;
        
        // Main DP loop
        for (let mask = 0; mask < (1 << n); mask++) {
            for (let pos = 0; pos < n; pos++) {
                if ((mask & (1 << pos)) === 0) continue;
                
                for (let city = 0; city < n; city++) {
                    if (mask & (1 << city)) continue;
                    
                    const newMask = mask | (1 << city);
                    const newDist = dp[mask][pos] + dist[pos][city];
                    
                    if (dp[mask][pos] !== Number.MAX_SAFE_INTEGER && newDist < dp[newMask][city]) {
                        dp[newMask][city] = newDist;
                        parent[newMask][city] = pos;
                    }
                }
            }
        }
        
        // Find the minimum cost path
        let finalDist = Number.MAX_SAFE_INTEGER;
        let lastCity = -1;
        
        for (let i = 0; i < n; i++) {
            if (i !== 0 && dp[VISITED_ALL][i] !== Number.MAX_SAFE_INTEGER) {
                const totalDist = dp[VISITED_ALL][i] + dist[i][0];
                if (totalDist < finalDist) {
                    finalDist = totalDist;
                    lastCity = i;
                }
            }
        }
        
        if (finalDist === Number.MAX_SAFE_INTEGER) {
            throw new Error('No valid solution found');
        }
        
        // Reconstruct path
        const path = [];
        let currMask = VISITED_ALL;
        let curr = lastCity;
        
        while (curr !== -1) {
            path.push(curr);
            const temp = parent[currMask][curr];
            currMask = currMask & ~(1 << curr);
            curr = temp;
        }
        
        path.push(0);
        path.reverse();
        
        return {
            distance: finalDist,
            path: path
        };
    } catch (error) {
        console.error('TSP Algorithm Error:', error);
        throw error;
    }
}

app.post('/solve', (req, res) => {
    try {
        console.log('Received request body:', req.body); // Debug log
        
        const { matrix } = req.body;
        
        if (!matrix || !Array.isArray(matrix)) {
            return res.status(400).json({ 
                error: 'Invalid input: matrix must be provided and must be an array' 
            });
        }
        
        if (matrix.length < 3) {
            return res.status(400).json({ 
                error: 'Need at least 3 locations' 
            });
        }
        
        const n = matrix.length;
        for (let i = 0; i < n; i++) {
            if (!Array.isArray(matrix[i]) || matrix[i].length !== n) {
                return res.status(400).json({ 
                    error: 'Invalid matrix format: must be a square matrix' 
                });
            }
        }
        
        const result = solveTSP(matrix);
        console.log('Computed result:', result); // Debug log
        
        res.json(result);
    } catch (error) {
        console.error('Server Error:', error); // Debug log
        res.status(500).json({ 
            error: `Internal server error: ${error.message}` 
        });
    }
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ 
        error: 'Internal server error: ' + err.message 
    });
});

// const response = await fetch('/solve', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({ matrix })
// });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


app.listen(port, () => {
    console.log(`TSP solver server running at http://localhost:${port}`);
});